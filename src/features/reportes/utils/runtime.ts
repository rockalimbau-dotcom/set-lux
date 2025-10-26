import { parseNum, parseHHMM, diffMinutes, ceilHours } from './numbers';
import { storage } from '@shared/services/localStorage.service';

interface Project {
  id?: string;
  nombre?: string;
  [key: string]: any;
}

interface CondParams {
  jornadaTrabajo: number;
  jornadaComida: number;
  cortesiaMin: number;
  taDiario: number;
  taFinde: number;
  nocturnoIni: string;
  nocturnoFin: string;
}

export function readCondParams(project: Project, mode?: 'semanal' | 'mensual' | 'publicidad'): CondParams {
  const base = project?.id || project?.nombre || 'tmp';
  
  // Si se especifica un modo, buscar solo ese modo primero
  if (mode) {
    const key = `cond_${base}_${mode}`;
    try {
      const obj = storage.getJSON<any>(key);
      if (obj) {
        const p = obj.params || {};
        return {
          jornadaTrabajo: parseNum(p.jornadaTrabajo ?? '9'),
          jornadaComida: parseNum(p.jornadaComida ?? '1'),
          cortesiaMin: parseNum(p.cortesiaMin ?? '15'),
          taDiario: parseNum(p.taDiario ?? '12'),
          taFinde: parseNum(p.taFinde ?? '48'),
          nocturnoIni: p.nocturnoIni ?? '22:00',
          nocturnoFin: p.nocturnoFin ?? '06:00',
        };
      }
    } catch {}
  }
  
  // Fallback: buscar en todos los modos
  const keys = [`cond_${base}_semanal`, `cond_${base}_mensual`, `cond_${base}_publicidad`];
  for (const k of keys) {
    try {
      const obj = storage.getJSON<any>(k);
      if (!obj) continue;
      const p = obj.params || {};
      return {
        jornadaTrabajo: parseNum(p.jornadaTrabajo ?? '9'),
        jornadaComida: parseNum(p.jornadaComida ?? '1'),
        cortesiaMin: parseNum(p.cortesiaMin ?? '15'),
        taDiario: parseNum(p.taDiario ?? '12'),
        taFinde: parseNum(p.taFinde ?? '48'),
        nocturnoIni: p.nocturnoIni ?? '22:00',
        nocturnoFin: p.nocturnoFin ?? '06:00',
      };
    } catch {}
  }
  return {
    jornadaTrabajo: 9,
    jornadaComida: 1,
    cortesiaMin: 15,
    taDiario: 12,
    taFinde: 48,
    nocturnoIni: '22:00',
    nocturnoFin: '06:00',
  };
}

export function getBlockWindow(day: any, block: 'base' | 'pre' | 'pick'): { start: string | null; end: string | null } {
  if (!day || day.tipo === 'Descanso') return { start: null, end: null };
  if (block === 'pre')
    return { start: day.prelightStart || null, end: day.prelightEnd || null };
  if (block === 'pick')
    return { start: day.pickupStart || null, end: day.pickupEnd || null };
  return { start: day.start || null, end: day.end || null };
}

export function buildDateTime(iso: string, hhmm: string): Date | null {
  const [y, m, d] = String(iso).split('-').map(Number);
  const mm = parseHHMM(hhmm);
  if (mm == null) return null;
  const H = Math.floor(mm / 60);
  const M = mm % 60;
  return new Date(y, m - 1, d, H, M, 0, 0);
}

export function calcHorasExtraMin(workedMin: number | null, baseHours: number, cortesiaMin: number): number {
  if (workedMin == null) return 0;
  const baseMin = Math.round((baseHours || 0) * 60);
  const over = workedMin - baseMin;
  if (over <= 0) return 0;
  let extras = over > (cortesiaMin ?? 15) ? 1 : 0;
  if (over > 60) {
    extras = Math.max(extras, 1 + Math.ceil((over - 60) / 60));
  }
  return extras;
}

export function hasNocturnidad(
  startHHMM: string,
  endHHMM: string,
  noctIni: string = '22:00',
  noctFin: string = '06:00'
): boolean {
  const iniMin = parseHHMM(startHHMM);
  const finMin = parseHHMM(endHHMM);
  const thIni = parseHHMM(noctIni) ?? 22 * 60;
  const thFin = parseHHMM(noctFin) ?? 6 * 60;
  if (iniMin == null || finMin == null) return false;
  if (iniMin >= thIni || finMin >= thIni) return true;
  if (iniMin < thFin || finMin < thFin) return true;
  return false;
}

export function findPrevWorkingContextFactory(
  getPlanAllWeeks: () => { pre?: any[]; pro?: any[] },
  mondayOf: (date: Date) => Date,
  toISO: (date: Date) => string
) {
  return function findPrevWorkingContext(currISO: string): {
    prevEnd: string | null;
    prevStart: string | null;
    prevISO: string | null;
    consecDesc: number;
  } {
    const { pre, pro } = getPlanAllWeeks();
    const allWeeks = [...(pre || []), ...(pro || [])].slice();
    allWeeks.sort((a, b) =>
      a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0
    );

    const [y, m, d] = String(currISO).split('-').map(Number);
    const mondayStr = toISO(mondayOf(new Date(y, m - 1, d)));
    const wIdx = allWeeks.findIndex((w: any) => w.startDate === mondayStr);
    if (wIdx < 0)
      return { prevEnd: null, prevStart: null, prevISO: null, consecDesc: 0 };

    const js = new Date(y, m - 1, d).getDay();
    let di = (js + 6) % 7;
    let wi = wIdx;
    di -= 1;
    if (di < 0) {
      wi -= 1;
      di = 6;
    }

    let consecDesc = 0;
    let steps = 0;

    while (wi >= 0 && steps < 120) {
      const w = allWeeks[wi];
      const day = w?.days?.[di];
      if (!day) break;

      const dateObj = new Date(w.startDate);
      dateObj.setDate(dateObj.getDate() + di);
      const iso = toISO(dateObj);

      if (day.tipo === 'Descanso') {
        consecDesc += 1;
      } else {
        return {
          prevEnd: day.end || null,
          prevStart: day.start || null,
          prevISO: iso,
          consecDesc,
        };
      }

      di -= 1;
      if (di < 0) {
        wi -= 1;
        di = 6;
      }
      steps += 1;
    }

    return { prevEnd: null, prevStart: null, prevISO: null, consecDesc };
  };
}
