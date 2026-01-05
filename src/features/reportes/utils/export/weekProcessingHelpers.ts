import { getTranslation } from './translationHelpers';

interface WeekProcessingParams {
  week: any;
  weekDays: string[];
  safeSemana: string[];
  horarioTexto: (iso: string) => string;
  horarioPrelightFn: (iso: string) => string;
  horarioPickupFn: (iso: string) => string;
  isWeekend: (iso: string) => boolean;
}

/**
 * Filter week days that should be included in the export
 */
export function filterWeekDaysForExport({
  weekDays,
  safeSemana,
  horarioTexto,
  horarioPrelightFn,
  horarioPickupFn,
  isWeekend,
}: Omit<WeekProcessingParams, 'week'>): string[] {
  const weekDaysInRange = weekDays.filter(day => safeSemana.includes(day));
  if (weekDaysInRange.length === 0) return [];

  const restLabel = getTranslation('planning.rest', 'DESCANSO');
  return weekDaysInRange.filter(iso => {
    const dayLabel = horarioTexto(iso);
    if (dayLabel === restLabel && isWeekend(iso)) {
      const hasPrelight = horarioPrelightFn(iso) !== '—';
      const hasPickup = horarioPickupFn(iso) !== '—';
      if (!hasPrelight && !hasPickup) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Translate week label
 */
export function translateWeekLabel(label: string): string {
  if (!label) return getTranslation('reports.week', 'Semana');
  const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
  if (match) {
    const number = match[2];
    if (number.startsWith('-')) {
      return getTranslation('planning.weekFormatNegative', `Semana -${number.substring(1)}`).replace('{{number}}', number.substring(1));
    } else {
      return getTranslation('planning.weekFormat', `Semana ${number}`).replace('{{number}}', number);
    }
  }
  return label;
}

