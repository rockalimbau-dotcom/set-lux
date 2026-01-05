import { useMemo } from 'react';
import { monthKeyFromISO } from '@shared/utils/date';
import { weekISOdays, weekAllPeopleActive } from '../../utils/plan';

/**
 * Hook para agrupar semanas por mes natural
 */
export function useMonthGrouping(weeks: any[]) {
  return useMemo(() => {
    const weeksWithPeople = weeks.filter((w: any) => weekAllPeopleActive(w).length > 0);

    const monthMap: Map<string, { weeks: Set<any>; isos: Set<string> }> = new Map();
    for (const w of weeksWithPeople) {
      const isos = weekISOdays(w);
      for (const iso of isos) {
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

