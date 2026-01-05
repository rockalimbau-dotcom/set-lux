import { WeekAndDay, BlockWindow, AutoCalculationsParams } from './useAutoCalculationsTypes';

/**
 * Habilita logs de debug basado en query params o localStorage
 */
export function isDebugEnabled(): boolean {
  try {
    const w: any = typeof window !== 'undefined' ? window : undefined;
    const qs = w ? new URLSearchParams(w.location.search).get('debug') || '' : '';
    const ls = w?.localStorage?.getItem('debug') || '';
    const val = String(qs || ls || '').toLowerCase();
    return val === 'ta' || val === 'on' || val === 'reportes';
  } catch {
    return false;
  }
}

/**
 * Genera una firma de los horarios de la semana para detectar cambios
 */
export function generatePlanWindowsSignature(
  safeSemana: readonly string[],
  findWeekAndDay: (iso: string) => WeekAndDay | any,
  getBlockWindow: (day: any, block: string) => BlockWindow
): string {
  return JSON.stringify((safeSemana as string[]).map(iso => {
    const ctx = findWeekAndDay(iso) as WeekAndDay;
    const b = getBlockWindow(ctx?.day, 'base') || { start: null, end: null };
    const p = getBlockWindow(ctx?.day, 'pre') || { start: null, end: null };
    const k = getBlockWindow(ctx?.day, 'pick') || { start: null, end: null };
    return {
      iso,
      bS: b.start || '',
      bE: b.end || '',
      pS: p.start || '',
      pE: p.end || '',
      kS: k.start || '',
      kE: k.end || '',
    };
  }));
}

/**
 * Normaliza los parámetros de cálculo con valores por defecto
 */
export function normalizeParams(params: AutoCalculationsParams): {
  baseHours: number;
  cortes: number;
  taD: number;
  taF: number;
} {
  const { jornadaTrabajo, jornadaComida, cortesiaMin, taDiario, taFinde } = params;
  return {
    baseHours:
      (isFinite(jornadaTrabajo) ? jornadaTrabajo : 9) +
      (isFinite(jornadaComida) ? jornadaComida : 1),
    cortes: isFinite(cortesiaMin) ? cortesiaMin : 15,
    taD: isFinite(taDiario) ? taDiario : 12,
    taF: isFinite(taFinde) ? taFinde : 48,
  };
}

/**
 * Encuentra el ISO anterior que tenga horario para un bloque específico
 */
export function findPrevISOForBlock(
  currISO: string,
  block: 'base' | 'pre' | 'pick',
  findWeekAndDay: (iso: string) => WeekAndDay | any,
  getBlockWindow: (day: any, block: string) => BlockWindow
): string | null {
  try {
    const [y0, m0, d0] = String(currISO).split('-').map(Number);
    const start = new Date(y0, (m0 || 1) - 1, d0 || 1);
    for (let step = 1; step <= 14; step++) {
      const dt = new Date(start.getTime() - step * 24 * 60 * 60 * 1000);
      const isoStep = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const ctx = findWeekAndDay(isoStep) as WeekAndDay;
      const bw = getBlockWindow(ctx?.day, block);
      if (bw?.end || bw?.start) return isoStep;
    }
  } catch {}
  return null;
}

/**
 * Determina el bloque de una fila basado en la clave de persona
 */
export function determineRowBlock(
  pk: string,
  explicitBlock?: 'pre' | 'pick'
): 'base' | 'pre' | 'pick' {
  if (explicitBlock) return explicitBlock;
  if (/\.pre__/.test(pk) || /REF\.pre__/.test(pk)) return 'pre';
  if (/\.pick__/.test(pk) || /REF\.pick__/.test(pk)) return 'pick';
  return 'base';
}

/**
 * Determina el rol para verificar si trabaja en un bloque
 */
export function determineRoleForCheck(
  role: string,
  rowBlock: 'base' | 'pre' | 'pick'
): string {
  if (role === 'REF') return 'REF';
  if (rowBlock === 'pre') return `${role}P`;
  if (rowBlock === 'pick') return `${role}R`;
  return role;
}

