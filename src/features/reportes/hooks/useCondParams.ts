import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import {
  buildCondParams,
  DEFAULTS_BY_MODE,
  readCondParams,
  type CondMode,
  type CondParams,
} from '../utils/runtime';

interface ProjectRef {
  id?: string;
  nombre?: string;
}

const hasStoredCond = (model: unknown): model is Record<string, unknown> =>
  model != null && typeof model === 'object' && Object.keys(model as object).length > 0;

const paramsFromModel = (model: Record<string, unknown>, mode: CondMode): CondParams =>
  buildCondParams((model as { params?: Record<string, unknown> }).params || {}, DEFAULTS_BY_MODE[mode]);

/**
 * Parámetros de condiciones (jornada 10+1, cortesía, TA, etc.) reactivos a cambios en localStorage.
 * Deriva del estado de useLocalStorage; un useMemo que solo llama readCondParams no se actualiza al editar Condiciones.
 */
export function useCondParams(project: ProjectRef | undefined, mode: CondMode = 'semanal'): CondParams {
  const base = project?.id || project?.nombre || 'tmp';
  const [condSemanal] = useLocalStorage<Record<string, unknown>>(`cond_${base}_semanal`, {});
  const [condMensual] = useLocalStorage<Record<string, unknown>>(`cond_${base}_mensual`, {});
  const [condDiario] = useLocalStorage<Record<string, unknown>>(`cond_${base}_diario`, {});
  const [condPublicidad] = useLocalStorage<Record<string, unknown>>(`cond_${base}_publicidad`, {});

  return useMemo(() => {
    const tryModel = (model: unknown, resolvedMode: CondMode): CondParams | null =>
      hasStoredCond(model) ? paramsFromModel(model, resolvedMode) : null;

    if (mode === 'semanal') {
      return tryModel(condSemanal, 'semanal') ?? readCondParams(project as ProjectRef, mode);
    }
    if (mode === 'mensual') {
      return tryModel(condMensual, 'mensual') ?? readCondParams(project as ProjectRef, mode);
    }
    return (
      tryModel(condDiario, 'diario') ??
      tryModel(condPublicidad, 'diario') ??
      readCondParams(project as ProjectRef, mode)
    );
  }, [project?.id, project?.nombre, mode, condSemanal, condMensual, condDiario, condPublicidad]);
}
