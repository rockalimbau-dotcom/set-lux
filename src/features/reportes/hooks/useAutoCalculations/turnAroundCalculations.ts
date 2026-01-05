import { WeekAndDay, BlockWindow, PrevWorkingContext, AutoCalculationsParams } from './useAutoCalculationsTypes';
import { ceilHours } from '../../utils/numbers';
import { findPrevISOForBlock } from './useAutoCalculationsUtils';

/**
 * Detecta si un turno cruza medianoche
 */
function detectMidnightCross(
  prevStartDT: Date | null,
  prevEndDT: Date,
  prevEndStr: string
): boolean {
  let crossed = false;
  if (prevStartDT && prevEndDT <= prevStartDT) crossed = true;
  // Heurística adicional: si el turno empieza a medianoche y termina por la mañana,
  // consideramos que finaliza al día siguiente (caso viernes 00:00-10:00 -> sábado 10:00)
  if (!crossed && prevStartDT) {
    const startH = prevStartDT.getHours();
    const endH = prevEndDT.getHours();
    if (startH === 0 && endH <= 12) crossed = true;
  }
  if (!prevStartDT) {
    const hh = Number(String(prevEndStr).split(':')[0] || '0');
    if (hh <= 6) crossed = true;
  }
  return crossed;
}

/**
 * Calcula Turn Around para el bloque base
 */
export function computeBaseTurnAround(
  iso: string,
  start: string | null,
  findWeekAndDay: (iso: string) => WeekAndDay | any,
  getBlockWindow: (day: any, block: string) => BlockWindow,
  buildDateTime: (iso: string, time: string) => Date | null,
  findPrevWorkingContext: (iso: string) => PrevWorkingContext,
  params: AutoCalculationsParams,
  debugEnabled: boolean
): number {
  if (!start) return 0;
  const { prevISO, consecDesc } = findPrevWorkingContext(iso);
  if (!prevISO) return 0;
  try {
    const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
    const prevBlk = getBlockWindow(prevCtx?.day, 'base');
    const prevEndStr = prevBlk?.end || null;
    const prevStartStr = prevBlk?.start || null;
    if (!prevEndStr) return 0;
    let prevEndDT = buildDateTime(prevISO, prevEndStr);
    const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
    const currStartDT = buildDateTime(iso, start);
    if (!prevEndDT || !currStartDT) return 0;

    const crossed = detectMidnightCross(prevStartDT, prevEndDT, prevEndStr);
    if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);

    const taD = isFinite(params.taDiario) ? params.taDiario : 12;
    const taF = isFinite(params.taFinde) ? params.taFinde : 48;
    const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
    const gapMin = Math.max(
      0,
      Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000)
    );

    // Debug TA Base
    if (debugEnabled) {
      try {
        console.debug('[TA.base]', {
          iso,
          prevISO,
          prevEndStr,
          start,
          gapMin,
          reqMin,
          ta: ceilHours(Math.max(0, reqMin - gapMin)),
        });
      } catch {}
    }

    return ceilHours(Math.max(0, reqMin - gapMin));
  } catch {
    return 0;
  }
}

/**
 * Calcula Turn Around para el bloque prelight
 */
export function computePrelightTurnAround(
  iso: string,
  start: string | null,
  findWeekAndDay: (iso: string) => WeekAndDay | any,
  getBlockWindow: (day: any, block: string) => BlockWindow,
  buildDateTime: (iso: string, time: string) => Date | null,
  findPrevWorkingContext: (iso: string) => PrevWorkingContext,
  params: AutoCalculationsParams
): number {
  if (!start) return 0;
  const { consecDesc } = findPrevWorkingContext(iso);
  const prevISO = findPrevISOForBlock(iso, 'pre', findWeekAndDay, getBlockWindow);
  if (!prevISO) return 0;
  try {
    const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
    const prevBlk = getBlockWindow(prevCtx?.day, 'pre');
    const prevEndStr = prevBlk?.end || null;
    const prevStartStr = prevBlk?.start || null;
    if (!prevEndStr) return 0;
    let prevEndDT = buildDateTime(prevISO, prevEndStr);
    const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
    const currStartDT = buildDateTime(iso, start);
    if (!prevEndDT || !currStartDT) return 0;

    const crossed = detectMidnightCross(prevStartDT, prevEndDT, prevEndStr);
    if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);

    const taD = isFinite(params.taDiario) ? params.taDiario : 12;
    const taF = isFinite(params.taFinde) ? params.taFinde : 48;
    const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
    const gapMin = Math.max(
      0,
      Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000)
    );

    return ceilHours(Math.max(0, reqMin - gapMin));
  } catch {
    return 0;
  }
}

/**
 * Calcula Turn Around para el bloque pickup
 */
export function computePickupTurnAround(
  iso: string,
  start: string | null,
  findWeekAndDay: (iso: string) => WeekAndDay | any,
  getBlockWindow: (day: any, block: string) => BlockWindow,
  buildDateTime: (iso: string, time: string) => Date | null,
  findPrevWorkingContext: (iso: string) => PrevWorkingContext,
  params: AutoCalculationsParams,
  debugEnabled: boolean
): number {
  if (!start) return 0;
  const { consecDesc } = findPrevWorkingContext(iso);
  const prevISO = findPrevISOForBlock(iso, 'pick', findWeekAndDay, getBlockWindow);
  if (!prevISO) return 0;
  try {
    const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
    const prevBlk = getBlockWindow(prevCtx?.day, 'pick');
    const prevEndStr = prevBlk?.end || null;
    const prevStartStr = prevBlk?.start || null;
    if (!prevEndStr) return 0;
    let prevEndDT = buildDateTime(prevISO, prevEndStr);
    const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
    const currStartDT = buildDateTime(iso, start);
    if (!prevEndDT || !currStartDT) return 0;

    const crossed = detectMidnightCross(prevStartDT, prevEndDT, prevEndStr);
    if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);

    const taD = isFinite(params.taDiario) ? params.taDiario : 12;
    const taF = isFinite(params.taFinde) ? params.taFinde : 48;
    const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
    const gapMin = Math.max(
      0,
      Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000)
    );

    // Debug TA Recogida
    if (debugEnabled) {
      try {
        console.debug('[TA.pick]', {
          iso,
          prevISO,
          prevEndStr,
          start,
          gapMin,
          reqMin,
          ta: ceilHours(Math.max(0, reqMin - gapMin)),
        });
      } catch {}
    }

    return ceilHours(Math.max(0, reqMin - gapMin));
  } catch {
    return 0;
  }
}

