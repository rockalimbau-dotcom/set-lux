import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { useTranslation } from 'react-i18next';

export const createHorarioHelpers = (
  findWeekAndDay: (iso: string) => { day: any },
  t: (key: string) => string
) => {
  const horarioTexto = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day) return t('reports.addInPlanning');
    if ((day.tipo || '') === 'Descanso') return t('reports.rest');
    
    const translateJornadaType = (tipo: string): string => {
      return translateJornadaTypeUtil(tipo, t);
    };
    
    const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Oficina' && day.tipo !== 'Rodaje Festivo' 
      ? `${translateJornadaType(day.tipo)}: ` 
      : '';
    if (!day.start || !day.end) return `${etiqueta}${t('reports.addInPlanning')}`;
    return `${etiqueta}${day.start}–${day.end}`;
  };

  const horarioPrelight = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '—';
    if (!day.prelightStart || !day.prelightEnd)
      return t('reports.addInPlanning');
    return `${day.prelightStart}–${day.prelightEnd}`;
  };
  
  const horarioPickup = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '—';
    if (!day.pickupStart || !day.pickupEnd) return t('reports.addInPlanning');
    return `${day.pickupStart}–${day.pickupEnd}`;
  };

  return { horarioTexto, horarioPrelight, horarioPickup };
};

