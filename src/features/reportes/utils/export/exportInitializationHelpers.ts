import { storage } from '@shared/services/localStorage.service';
import { getTranslation } from './translationHelpers';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';

interface InitializeExportHelpersParams {
  project: any;
  findWeekAndDay: (iso: string) => any;
  horarioPrelight?: (iso: string) => string;
  horarioPickup?: (iso: string) => string;
}

interface InitializeExportHelpersReturn {
  translateJornadaType: (tipo: string) => string;
  horarioTexto: (iso: string) => string;
  horarioPrelightFn: (iso: string) => string;
  horarioPickupFn: (iso: string) => string;
  getPlanAllWeeks: () => { pre: any[]; pro: any[] };
}

/**
 * Initialize helper functions for export
 */
export async function initializeExportHelpers({
  project,
  findWeekAndDay,
  horarioPrelight,
  horarioPickup,
}: InitializeExportHelpersParams): Promise<InitializeExportHelpersReturn> {
  const { horarioPrelightFactory, horarioPickupFactory } = await import('../derive');

  const planKey = `needs_${project?.id || project?.nombre || 'demo'}`;
  const getPlanAllWeeks = () => {
    try {
      const obj = storage.getJSON<any>(planKey);
      if (!obj) return { pre: [], pro: [] };
      return needsDataToPlanData(obj);
    } catch {
      return { pre: [], pro: [] };
    }
  };

  const translateJornadaType = (tipo: string): string => {
    return translateJornadaTypeUtil(tipo, (key: string, defaultValue?: string) => getTranslation(key, defaultValue || key));
  };

  const horarioTexto = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    const addInPlanning = getTranslation('reports.addInPlanning', 'Añadelo en Calendario');
    if (!day) return '';
    if ((day.tipo || '') === 'Descanso') return getTranslation('planning.rest', 'DESCANSO');
    const hasBase = Array.isArray(day.crewList) && day.crewList.length > 0;
    if (!hasBase) return '';
    const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Oficina' && day.tipo !== 'Rodaje Festivo' ? `${translateJornadaType(day.tipo)}: ` : '';
    if (!day.start || !day.end) return `${etiqueta}${addInPlanning}`;
    return `${etiqueta}${day.start}–${day.end}`;
  };

  const horarioPrelightFn = horarioPrelight || horarioPrelightFactory(findWeekAndDay);
  const horarioPickupFn = horarioPickup || horarioPickupFactory(findWeekAndDay);

  return {
    translateJornadaType,
    horarioTexto,
    horarioPrelightFn,
    horarioPickupFn,
    getPlanAllWeeks,
  };
}

