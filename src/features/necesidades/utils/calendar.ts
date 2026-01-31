import { addDays, pad2, parseYYYYMMDD, toYYYYMMDD } from '@shared/utils/date';
import { mdKey } from '@shared/utils/dateKey';

interface NeedsDay {
  crewTipo?: string;
  crewList?: any[];
  crewTxt?: string;
  manualTipo?: boolean;
  [key: string]: any;
}

interface NeedsWeek {
  days?: NeedsDay[];
  [key: string]: any;
}

function normalizeDays(days: any): NeedsDay[] {
  if (Array.isArray(days)) return days;
  if (days && typeof days === 'object') {
    const normalized: NeedsDay[] = [];
    for (let i = 0; i < 7; i++) {
      const byNumber = (days as any)[i];
      const byString = (days as any)[String(i)];
      normalized[i] = (byNumber || byString || {}) as NeedsDay;
    }
    return normalized;
  }
  return [];
}

function isHolidayDate(date: Date, holidayFull: Set<string>, holidayMD: Set<string>): boolean {
  const ymd = toYYYYMMDD(date);
  const mmdd = mdKey(date.getMonth() + 1, date.getDate());
  const ddmm = `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}`;
  return holidayFull.has(ymd) || holidayMD.has(mmdd) || holidayMD.has(ddmm);
}

export function relabelNeedsWeekByCalendar(
  week: NeedsWeek,
  mondayDateStr: string,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): NeedsWeek {
  const monday = parseYYYYMMDD(mondayDateStr);
  const days = normalizeDays(week.days);
  return {
    ...week,
    startDate: mondayDateStr,
    days: days.map((d, i) => {
      if ((d as any)?.manualTipo === true) return d;

      const dateObj = addDays(monday, i);
      const isWeekend = i === 5 || i === 6;
      const isHoliday = isHolidayDate(dateObj, holidayFull, holidayMD);

      const next = { ...d };
      const tipo = String(next.crewTipo || '').trim();

      if (isWeekend) {
        if (!tipo) {
          next.crewTipo = 'Descanso';
          next.crewList = [];
        }
      } else if (isHoliday) {
        if (!tipo || tipo === 'Rodaje' || tipo === 'Oficina') {
          next.crewTipo = 'Rodaje Festivo';
        }
      } else if (tipo === 'Rodaje Festivo') {
        next.crewTipo = 'Rodaje';
      }

      return next;
    }),
  };
}

export async function relabelNeedsWeekByCalendarDynamic(
  week: NeedsWeek,
  mondayDateStr: string,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Promise<NeedsWeek> {
  const monday = parseYYYYMMDD(mondayDateStr);
  const days = normalizeDays(week.days);
  return {
    ...week,
    startDate: mondayDateStr,
    days: await Promise.all(
      days.map(async (d, i) => {
        if ((d as any)?.manualTipo === true) return d;

        const dateObj = addDays(monday, i);
        const isWeekend = i === 5 || i === 6;
        const isHoliday = isHolidayDate(dateObj, holidayFull, holidayMD);

        const next = { ...d };
        const tipo = String(next.crewTipo || '').trim();

        if (isWeekend) {
          if (!tipo) {
            next.crewTipo = 'Descanso';
            next.crewList = [];
          }
        } else if (isHoliday) {
          if (!tipo || tipo === 'Rodaje' || tipo === 'Oficina') {
            next.crewTipo = 'Rodaje Festivo';
          }
        } else if (tipo === 'Rodaje Festivo') {
          next.crewTipo = 'Rodaje';
        }

        return next;
      })
    ),
  };
}
