import {
  pad2,
  toYYYYMMDD,
  parseYYYYMMDD,
  addDays,
} from '../../../shared/utils/date';
import { DAYS, mdKey } from '../constants';

interface TeamMember {
  role?: string;
  name?: string;
  source?: string;
  [key: string]: any;
}

interface Day {
  name: string;
  tipo: string;
  start: string;
  end: string;
  cut: string;
  loc: string;
  team: TeamMember[];
  prelight: TeamMember[];
  pickup: TeamMember[];
  prelightStart: string;
  prelightEnd: string;
  pickupStart: string;
  pickupEnd: string;
  issue: string;
  [key: string]: any;
}

interface Week {
  id: string;
  label: string;
  startDate: string;
  days: Day[];
  [key: string]: any;
}

export const createEmptyDay = (name: string, baseTeam: TeamMember[] = []): Day => ({
  name,
  tipo: 'Rodaje',
  start: '',
  end: '',
  cut: '',
  loc: '',
  team: baseTeam.map(m => ({ role: m.role, name: m.name, source: 'base' })),
  prelight: [],
  pickup: [],
  prelightStart: '',
  prelightEnd: '',
  pickupStart: '',
  pickupEnd: '',
  issue: '',
});

export const createWeek = (
  label: string,
  startDateStr: string,
  baseTeam: TeamMember[] = [],
  preTeam: TeamMember[] = [],
  pickTeam: TeamMember[] = [],
  holidayFull: Set<string> = new Set(),
  holidayMD: Set<string> = new Set()
): Week => {
  const start = parseYYYYMMDD(startDateStr);
  return {
    id: crypto?.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
    label,
    startDate: startDateStr,
    days: DAYS.map(d => {
      const day = createEmptyDay(d.name, baseTeam);

      const dateObj = addDays(start, d.idx);
      const ymd = toYYYYMMDD(dateObj);
      const mmdd = mdKey(dateObj.getMonth() + 1, dateObj.getDate());
      const ddmm = `${pad2(dateObj.getDate())}-${pad2(dateObj.getMonth() + 1)}`;
      if (holidayFull.has(ymd) || holidayMD.has(mmdd) || holidayMD.has(ddmm)) {
        day.tipo = 'Rodaje Festivo';
      }

      if (d.idx === 5 || d.idx === 6) {
        day.tipo = 'Descanso';
        day.team = [];
        day.prelight = [];
        day.pickup = [];
        day.start = '';
        day.end = '';
        day.cut = '';
        day.loc = 'DESCANSO';
        day.prelightStart = '';
        day.prelightEnd = '';
        day.pickupStart = '';
        day.pickupEnd = '';
        return day;
      }

      if (holidayFull.has(ymd) || holidayMD.has(mmdd)) {
        day.tipo = 'Rodaje Festivo';
      }

      return day;
    }),
  };
};
