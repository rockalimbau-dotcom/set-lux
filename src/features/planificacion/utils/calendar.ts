import {
  pad2,
  toYYYYMMDD,
  parseYYYYMMDD,
  addDays,
} from '../../../shared/utils/date';
// import { isFestivo, isFestivoDynamic } from '@shared/constants/festivos';
import { mdKey } from '../constants';

interface Day {
  tipo?: string;
  team?: any[];
  loc?: string;
  [key: string]: any;
}

interface Week {
  days?: Day[];
  [key: string]: any;
}

export function relabelWeekByCalendar(
  week: Week,
  mondayDateStr: string,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Week {
  const monday = parseYYYYMMDD(mondayDateStr);
  return {
    ...week,
    startDate: mondayDateStr,
    days: (week.days || []).map((d, i) => {
      // Respeta overrides manuales del usuario
      if ((d as any)?.manualTipo === true) {
        return d;
      }
      const dateObj = addDays(monday, i);
      const ymd = toYYYYMMDD(dateObj);
      const mmdd = mdKey(dateObj.getMonth() + 1, dateObj.getDate());
      const ddmm = `${pad2(dateObj.getDate())}-${pad2(dateObj.getMonth() + 1)}`;
      const isWeekend = i === 5 || i === 6;
      const isHoliday =
        holidayFull.has(ymd) || holidayMD.has(mmdd) || holidayMD.has(ddmm);

      const next = { ...d };

      if (isWeekend) {
        if (!next.tipo) {
          next.tipo = 'Descanso';
          next.team = [];
          next.loc = 'DESCANSO';
        }
      } else if (isHoliday) {
        if (!next.tipo || next.tipo === 'Rodaje' || next.tipo === 'Oficina') {
          next.tipo = 'Rodaje Festivo';
          if (next.loc === 'DESCANSO') next.loc = '';
        }
      } else {
        if (next.tipo !== 'Descanso' && next.loc === 'DESCANSO') {
          next.loc = '';
        }
        // Revertir festivo si ya no aplica con datos actuales
        if (next.tipo === 'Rodaje Festivo') {
          // Mantener el tipo original si era Oficina, sino volver a Rodaje
          // Por ahora siempre volvemos a Rodaje, pero podríamos guardar el tipo original
          next.tipo = 'Rodaje';
        }
      }

      return next;
    }),
  };
}

export async function relabelWeekByCalendarDynamic(
  week: Week,
  mondayDateStr: string,
  holidayFull: Set<string>,
  holidayMD: Set<string>
): Promise<Week> {
  const monday = parseYYYYMMDD(mondayDateStr);
  // const year = monday.getFullYear();
  
  return {
    ...week,
    startDate: mondayDateStr,
    days: await Promise.all((week.days || []).map(async (d, i) => {
      // Respeta overrides manuales del usuario
      if ((d as any)?.manualTipo === true) {
        return d;
      }
      const dateObj = addDays(monday, i);
      const ymd = toYYYYMMDD(dateObj);
      const mmdd = mdKey(dateObj.getMonth() + 1, dateObj.getDate());
      const ddmm = `${pad2(dateObj.getDate())}-${pad2(dateObj.getMonth() + 1)}`;
      const isWeekend = i === 5 || i === 6;
      
      // Use dynamic holiday data
      const isHoliday =
        holidayFull.has(ymd) || 
        holidayMD.has(mmdd) || 
        holidayMD.has(ddmm);

      const next = { ...d };

      if (isWeekend) {
        if (!next.tipo) {
          next.tipo = 'Descanso';
          next.team = [];
          next.loc = 'DESCANSO';
        }
      } else if (isHoliday) {
        if (!next.tipo || next.tipo === 'Rodaje' || next.tipo === 'Oficina') {
          next.tipo = 'Rodaje Festivo';
          if (next.loc === 'DESCANSO') next.loc = '';
        }
      } else {
        if (next.tipo !== 'Descanso' && next.loc === 'DESCANSO') {
          next.loc = '';
        }
        // Revertir festivo si ya no aplica con datos actuales
        if (next.tipo === 'Rodaje Festivo') {
          // Mantener el tipo original si era Oficina, sino volver a Rodaje
          // Por ahora siempre volvemos a Rodaje, pero podríamos guardar el tipo original
          next.tipo = 'Rodaje';
        }
      }

      return next;
    })),
  };
}
