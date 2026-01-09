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

export function readCondParams(project: Project, mode?: 'semanal' | 'mensual' | 'diario'): CondParams {
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
  const keys = [`cond_${base}_semanal`, `cond_${base}_mensual`, `cond_${base}_diario`];
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

// Nueva función para calcular horas extra en formato decimal (minutaje desde corte)
export function calcHorasExtraMinutajeDesdeCorte(workedMin: number | null, baseHours: number): number {
  if (workedMin == null) return 0;
  const baseMin = Math.round((baseHours || 0) * 60);
  const over = workedMin - baseMin;
  if (over <= 0) return 0;
  // Retorna minutos en decimal (ej: 30 min = 0.5, 90 min = 1.5)
  return over / 60;
}

// Nueva función para calcular horas extra con cortesía (minutaje + cortesía)
export function calcHorasExtraMinutajeConCortesia(workedMin: number | null, baseHours: number, cortesiaMin: number): number {
  if (workedMin == null) return 0;
  const baseMin = Math.round((baseHours || 0) * 60);
  const over = workedMin - baseMin;
  if (over <= 0) return 0;
  // Si no supera la cortesía, retorna 0
  if (over <= (cortesiaMin ?? 15)) return 0;
  // Si supera la cortesía, cuenta desde la hora (sin incluir cortesía)
  // Retorna minutos en decimal
  return over / 60;
}

// Función para formatear horas extra en decimal con minutos/horas entre paréntesis
export function formatHorasExtraDecimal(value: number): string {
  if (value <= 0) return '';
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let decimalStr = value.toFixed(2);
  // Quitar ceros innecesarios al final
  decimalStr = decimalStr.replace(/\.?0+$/, '');
  
  if (totalMinutes < 60) {
    return `${decimalStr} (${totalMinutes}')`;
  } else if (minutes === 0) {
    return `${decimalStr} (${hours}h)`;
  } else {
    return `${decimalStr} (${hours}h ${minutes}')`;
  }
}

// Función para extraer el valor numérico de un string formateado
export function extractNumericValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  // Si tiene formato "1.5 (1 h y 30 minutos)" o similar, extraer el número decimal
  const match = value.match(/^([\d.]+)/);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? 0 : num;
  }
  
  // Si es solo un número
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Función para convertir un valor de horas extra al formato del nuevo tipo
export function convertHorasExtraToNewFormat(
  currentValue: string | number,
  newTipo: string
): string {
  if (!currentValue || currentValue === '') return '';
  
  // Convertir a string para procesamiento
  const strValue = String(currentValue).trim();
  if (strValue === '') return '';
  
  // Extraer el valor numérico (maneja tanto "1" como "1 (1h)" como "1.5 (1 h y 30 minutos)")
  const numValue = extractNumericValue(strValue);
  if (numValue <= 0 || isNaN(numValue)) return '';
  
  // Si el nuevo tipo es "Normal", devolver como número entero si es posible, sino decimal
  if (newTipo === 'Hora Extra - Normal') {
    // Si es un número entero, devolver sin decimales
    if (numValue % 1 === 0) {
      return String(Math.round(numValue));
    }
    // Si tiene decimales, devolver con 2 decimales máximo, quitando ceros innecesarios
    const formatted = numValue.toFixed(2).replace(/\.?0+$/, '');
    return formatted || String(numValue);
  }
  
  // Para los otros tipos (Minutaje desde corte, Minutaje + Cortesía), convertir a formato decimal con paréntesis
  // Si ya está en formato con paréntesis y el número coincide con el tipo correcto, mantenerlo
  // Pero solo si el tipo actual también requiere formato con paréntesis
  const needsParenthesesFormat = newTipo === 'Hora Extra - Minutaje desde corte' || 
                                  newTipo === 'Hora Extra - Minutaje + Cortesía';
  
  if (needsParenthesesFormat && typeof currentValue === 'string' && currentValue.includes('(')) {
    const existingNum = extractNumericValue(currentValue);
    // Si el número coincide (con tolerancia), mantener el formato actual
    if (Math.abs(existingNum - numValue) < 0.01) {
      return currentValue; // Ya está en el formato correcto
    }
  }
  
  // Convertir a formato decimal con paréntesis
  return formatHorasExtraDecimal(numValue);
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
  toYYYYMMDD: (date: Date) => string
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
    const mondayStr = toYYYYMMDD(mondayOf(new Date(y, m - 1, d)));
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
      const iso = toYYYYMMDD(dateObj);

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
