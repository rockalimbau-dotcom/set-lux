import { toYYYYMMDD, parseYYYYMMDD, addDays } from '../../../shared/utils/date';
import i18n from '../../../i18n/config';

import { relabelWeekByCalendar } from './calendar';
import { createWeek } from './weeks';

interface Week {
  id: string;
  label: string;
  startDate: string;
  [key: string]: any;
}

interface TeamMember {
  role?: string;
  name?: string;
  [key: string]: any;
}

export const nextStartForPro = (preWeeks: Week[], proWeeks: Week[]): string => {
  if (proWeeks.length > 0) {
    const last = proWeeks[proWeeks.length - 1];
    return toYYYYMMDD(addDays(parseYYYYMMDD(last.startDate), 7));
  }
  if (preWeeks.length > 0) {
    const sorted = [...preWeeks].sort(
      (a, b) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime()
    );
    return toYYYYMMDD(
      addDays(parseYYYYMMDD(sorted[sorted.length - 1].startDate), 7)
    );
  }
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return toYYYYMMDD(d);
};

export const nextStartForPre = (preWeeks: Week[], proWeeks: Week[]): string => {
  if (preWeeks.length > 0) {
    const sorted = [...preWeeks].sort(
      (a, b) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime()
    );
    return toYYYYMMDD(addDays(parseYYYYMMDD(sorted[0].startDate), -7));
  }
  if (proWeeks.length > 0) {
    return toYYYYMMDD(addDays(parseYYYYMMDD(proWeeks[0].startDate), -7));
  }
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff - 7);
  return toYYYYMMDD(d);
};

export const addPreWeekAction = (
  preWeeks: Week[],
  baseRoster: TeamMember[],
  preRoster: TeamMember[],
  pickRoster: TeamMember[],
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Week[] => {
  const weekNumber = preWeeks.length + 1;
  const label = i18n.t('planning.weekFormatNegative', { number: weekNumber });
  const start = nextStartForPre(preWeeks, []);
  const next = [
    ...preWeeks,
    createWeek(
      label,
      start,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    ),
  ].sort((a, b) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime());
  return next;
};

export const addProWeekAction = (
  preWeeks: Week[],
  proWeeks: Week[],
  baseRoster: TeamMember[],
  preRoster: TeamMember[],
  pickRoster: TeamMember[],
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Week[] => {
  const weekNumber = proWeeks.length + 1;
  const label = i18n.t('planning.weekFormat', { number: weekNumber });
  const start = nextStartForPro(preWeeks, proWeeks);
  const next = [
    ...proWeeks,
    createWeek(
      label,
      start,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    ),
  ];
  return next;
};

export const duplicateWeekAction = (
  weeks: Week[], 
  weekId: string, 
  direction: number, 
  makeLabel?: (count: number) => string
): Week[] => {
  const w = weeks.find(x => x.id === weekId);
  if (!w) return weeks;
  const dup = JSON.parse(JSON.stringify(w));
  dup.id = crypto?.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const weekNumber = weeks.length + 1;
  dup.label =
    typeof makeLabel === 'function'
      ? makeLabel(weekNumber)
      : i18n.t('planning.weekFormat', { number: weekNumber });
  dup.startDate = toYYYYMMDD(
    addDays(parseYYYYMMDD(w.startDate), direction * 7)
  );
  return [...weeks, dup];
};

export const rebaseWeeksAround = (
  preWeeks: Week[],
  proWeeks: Week[],
  weekId: string,
  monday: Date,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): { pre: Week[]; pro: Week[] } => {
  const all = [...preWeeks, ...proWeeks].sort(
    (a, b) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime()
  );
  const anchorIdx = all.findIndex(w => w.id === weekId);
  if (anchorIdx === -1) return { pre: preWeeks, pro: proWeeks };
  const idToNewDate = new Map(
    all.map((w, i) => {
      const offsetWeeks = i - anchorIdx;
      const d = addDays(monday, offsetWeeks * 7);
      return [w.id, toYYYYMMDD(d)];
    })
  );
  const rebased = (list: Week[]): Week[] =>
    [...list]
      .map(w =>
        relabelWeekByCalendar(
          w,
          idToNewDate.get(w.id) || w.startDate,
          holidayFull,
          holidayMD
        )
      )
      .sort((a, b) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime());
  return { pre: rebased(preWeeks), pro: rebased(proWeeks) };
};

/**
 * Reordena y recalcula las semanas después de eliminar una
 * - Renombra los labels (Semana 1, Semana 2, etc.)
 * - Recalcula las fechas para que sean consecutivas
 */
export const reorderWeeksAfterDelete = (
  weeks: Week[],
  isPre: boolean,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Week[] => {
  if (weeks.length === 0) return weeks;
  
  // Ordenar por fecha ascendente (más antigua primero, más reciente último)
  // Tanto para preproducción como producción, visualmente queremos las antiguas arriba
  const sorted = [...weeks].sort((a, b) => {
    const timeA = parseYYYYMMDD(a.startDate).getTime();
    const timeB = parseYYYYMMDD(b.startDate).getTime();
    return timeA - timeB;
  });
  
  // Si solo hay una semana, solo actualizar el label
  if (sorted.length === 1) {
    const week = sorted[0];
    const label = isPre
      ? i18n.t('planning.weekFormatNegative', { number: 1 })
      : i18n.t('planning.weekFormat', { number: 1 });
    return [relabelWeekByCalendar({ ...week, label }, week.startDate, holidayFull, holidayMD)];
  }
  
  // Recalcular fechas y labels
  const firstWeekStart = parseYYYYMMDD(sorted[0].startDate);
  
  return sorted.map((week, index) => {
    // Para preproducción: numerar de forma inversa
    // La más antigua (índice 0) será -4, -3, -2, y la más reciente (última) será -1
    // Para producción: numerar normalmente (1, 2, 3, 4...)
    const weekNumber = isPre ? sorted.length - index : index + 1;
    const label = isPre
      ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
      : i18n.t('planning.weekFormat', { number: weekNumber });
    
    // Calcular nueva fecha: primera semana (más antigua) + (índice * 7 días) hacia adelante
    const newStartDate = toYYYYMMDD(addDays(firstWeekStart, index * 7));
    
    return relabelWeekByCalendar(
      { ...week, label },
      newStartDate,
      holidayFull,
      holidayMD
    );
  });
};
