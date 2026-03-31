import { useMemo } from 'react';
import { monthKeyFromISO } from '@shared/utils/date';
import { weekISOdays, weekAllPeopleActive } from '../../utils/plan';

function dayHasPayrollActivity(day: any): boolean {
  if (!day) return false;

  const tipo = String(day?.crewTipo ?? day?.tipo ?? '').trim().toLowerCase();
  const isRestLike = tipo === 'descanso' || tipo === 'fin';

  const hasBase = Array.isArray(day?.team) ? day.team.length > 0 : Array.isArray(day?.crewList) ? day.crewList.length > 0 : false;
  const hasPre = Array.isArray(day?.prelight) ? day.prelight.length > 0 : Array.isArray(day?.preList) ? day.preList.length > 0 : false;
  const hasPick = Array.isArray(day?.pickup) ? day.pickup.length > 0 : Array.isArray(day?.pickList) ? day.pickList.length > 0 : false;
  const hasExtra = Array.isArray(day?.refList)
    ? day.refList.length > 0
    : Array.isArray(day?.refBlocks)
    ? day.refBlocks.some((block: any) => Array.isArray(block?.list) && block.list.length > 0)
    : false;

  if (hasBase || hasPre || hasPick || hasExtra) return true;
  if (isRestLike) return false;

  const hasHours =
    String(day?.crewStart ?? day?.start ?? '').trim() !== '' ||
    String(day?.crewEnd ?? day?.end ?? '').trim() !== '' ||
    String(day?.preStart ?? day?.prelightStart ?? '').trim() !== '' ||
    String(day?.preEnd ?? day?.prelightEnd ?? '').trim() !== '' ||
    String(day?.pickStart ?? day?.pickupStart ?? '').trim() !== '' ||
    String(day?.pickEnd ?? day?.pickupEnd ?? '').trim() !== '' ||
    String(day?.refStart ?? '').trim() !== '' ||
    String(day?.refEnd ?? '').trim() !== '';

  return hasHours;
}

/**
 * Hook para agrupar semanas por mes natural
 */
export function useMonthGrouping(weeks: any[]) {
  return useMemo(() => {
    const weeksWithPeople = weeks.filter((w: any) => weekAllPeopleActive(w).length > 0);

    const monthMap: Map<string, { weeks: Set<any>; isos: Set<string> }> = new Map();
    for (const w of weeksWithPeople) {
      const isos = weekISOdays(w);
      const days = Array.isArray(w?.days) ? w.days : [];
      for (let idx = 0; idx < isos.length; idx++) {
        const iso = isos[idx];
        const day = days[idx];
        if (!dayHasPayrollActivity(day)) continue;
        const mk = monthKeyFromISO(iso);
        if (!monthMap.has(mk)) monthMap.set(mk, { weeks: new Set(), isos: new Set() });
        const bucket = monthMap.get(mk)!;
        bucket.weeks.add(w);
        bucket.isos.add(iso);
      }
    }
    const monthKeys = Array.from(monthMap.keys()).sort();

    return { monthMap, monthKeys, weeksWithPeople };
  }, [weeks]);
}
