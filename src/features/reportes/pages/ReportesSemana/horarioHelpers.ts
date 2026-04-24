import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { BLOCKS, getDayBlockList } from '../../utils/plan';
import { formatExtraScheduleByIndex, formatExtraSchedules } from '../../utils/extra';
import { getReportDayType } from '../../utils/dayTypePalette';

export const createHorarioHelpers = (
  findWeekAndDay: (iso: string) => { day: any },
  t: (key: string) => string
) => {
  const horarioTexto = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day) return '';
    if ((day.tipo || '') === 'Descanso') return t('reports.rest');
    const baseList = getDayBlockList(day, BLOCKS.base);
    const hasBase = Array.isArray(baseList) && baseList.length > 0;
    if (!hasBase) return '';
    
    const translateJornadaType = (tipo: string): string => {
      return translateJornadaTypeUtil(tipo, t);
    };
    
    const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Oficina' && day.tipo !== 'Rodaje Festivo' 
      ? `${translateJornadaType(day.tipo)}: ` 
      : '';
    if (!day.start || !day.end) return `${etiqueta}${t('reports.addInPlanning')}`;
    return `${etiqueta}${day.start}–${day.end}`;
  };

  const jornadaTipoTexto = (iso: string, blockKey: string = 'base') => {
    const { day } = findWeekAndDay(iso);
    if (!day) return '';
    const tipo = getReportDayType(day, blockKey);
    return tipo ? translateJornadaTypeUtil(tipo, t) : '';
  };

  const horarioPrelight = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '';
    const preList = getDayBlockList(day, BLOCKS.pre);
    if (!Array.isArray(preList) || preList.length === 0) return '';
    if (!day.prelightStart || !day.prelightEnd)
      return t('reports.addInPlanning');
    return `${day.prelightStart}–${day.prelightEnd}`;
  };
  
  const horarioPickup = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '';
    const pickList = getDayBlockList(day, BLOCKS.pick);
    if (!Array.isArray(pickList) || pickList.length === 0) return '';
    if (!day.pickupStart || !day.pickupEnd) return t('reports.addInPlanning');
    return `${day.pickupStart}–${day.pickupEnd}`;
  };

  const horarioExtra = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '';
    const refList = getDayBlockList(day, BLOCKS.extra);
    if (!Array.isArray(refList) || refList.length === 0) return '';
    const formatted = formatExtraSchedules(day, t('reports.addInPlanning'), t);
    return formatted || t('reports.addInPlanning');
  };

  const horarioExtraByIndex = (index: number) => (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '';
    return formatExtraScheduleByIndex(day, index, t('reports.addInPlanning'), t);
  };

  return { horarioTexto, jornadaTipoTexto, horarioPrelight, horarioPickup, horarioExtra, horarioExtraByIndex };
};
