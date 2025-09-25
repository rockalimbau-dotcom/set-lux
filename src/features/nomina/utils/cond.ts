// Carga el modelo de condiciones (prices/params) desde localStorage
// priorizando el modo del proyecto y con retrocompatibilidad.
import { storage } from '@shared/services/localStorage.service';

export function loadCondModel(project: { id?: string; nombre?: string; conditionsMode?: string; conditions?: { tipo?: string; mode?: string } } | null, modeOverride?: string) {
  const base = project?.id || project?.nombre || 'tmp';
  const mode = (
    modeOverride ||
    project?.conditionsMode ||
    project?.conditions?.tipo ||
    project?.conditions?.mode ||
    'semanal'
  )
    .toString()
    .toLowerCase();

  const keys = [
    `cond_${base}_${mode}`,
    `cond_${base}_mensual`,
    `cond_${base}_semanal`,
    `cond_${base}_publicidad`,
  ];
  for (const k of keys) {
    try {
      const obj = storage.getJSON<any>(k);
      if (!obj) continue;
      return obj; // { prices:{...}, params:{...} }
    } catch {}
  }
  return {} as any;
}


