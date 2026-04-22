import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { relabelWeekByCalendar, relabelWeekByCalendarDynamic } from '../../utils/calendar';
import { syncAllWeeks } from '../../utils/sync';
import { AnyRecord } from '@shared/types/common';

export function useWeeksData(
  storageKey: string,
  holidayFull: Set<string>,
  holidayMD: Set<string>,
  baseRoster: AnyRecord[],
  preRoster: AnyRecord[],
  pickRoster: AnyRecord[],
  refsRoster: AnyRecord[]
) {
  const [weeksData, setWeeksData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, {
    pre: [],
    pro: [],
  });
  const [preWeeks, setPreWeeks] = useState<AnyRecord[]>(weeksData.pre || []);
  const [proWeeks, setProWeeks] = useState<AnyRecord[]>(weeksData.pro || []);
  const [isLoaded, setIsLoaded] = useState(false);

  const [openPre, setOpenPre] = useLocalStorage<boolean>(
    `plan_open_pre_${storageKey}`,
    true
  );
  const [openPro, setOpenPro] = useLocalStorage<boolean>(
    `plan_open_pro_${storageKey}`,
    true
  );

  // Sincronizar semanas desde datos persistidos
  useEffect(() => {
    setPreWeeks(weeksData.pre || []);
    setProWeeks(weeksData.pro || []);
    setIsLoaded(true);
  }, [weeksData]);

  // Sincronizar cambios de semanas de vuelta a weeksData con debounce
  const prevWeeksRef = useRef<{ pre: AnyRecord[]; pro: AnyRecord[] } | null>(null);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // Evitar escrituras innecesarias comparando con el valor anterior
    const currentWeeks = { pre: preWeeks, pro: proWeeks };
    const prevWeeks = prevWeeksRef.current;
    
    if (prevWeeks && 
        prevWeeks.pre.length === currentWeeks.pre.length &&
        prevWeeks.pro.length === currentWeeks.pro.length &&
        prevWeeks.pre.every((w, i) => w.id === currentWeeks.pre[i]?.id) &&
        prevWeeks.pro.every((w, i) => w.id === currentWeeks.pro[i]?.id)) {
      // No hay cambios significativos, no escribir
      return;
    }
    
    prevWeeksRef.current = currentWeeks;
    
    // Usar debounce más largo para datos grandes
    const totalSize = preWeeks.length + proWeeks.length;
    const debounceTime = totalSize > 10 ? 500 : 300;
    
    const timeoutId = setTimeout(() => {
      setWeeksData(currentWeeks);
    }, debounceTime);
    
    return () => clearTimeout(timeoutId);
  }, [preWeeks, proWeeks, isLoaded, setWeeksData]);

  // Relabel weeks with holidays
  const holidayKey = useMemo(
    () => `${holidayFull.size}_${holidayMD.size}`,
    [holidayFull, holidayMD]
  );

  useEffect(() => {
    if (!isLoaded) return;

    const relabelWithDynamic = async (weeks: AnyRecord[]) => {
      return Promise.all(
        (weeks || []).map(async w => {
          try {
            return await relabelWeekByCalendarDynamic(w, w.startDate, holidayFull, holidayMD);
          } catch {
            return relabelWeekByCalendar(w, w.startDate, holidayFull, holidayMD);
          }
        })
      );
    };

    const updateWeeks = async () => {
      const [newPreWeeks, newProWeeks] = await Promise.all([
        relabelWithDynamic(preWeeks),
        relabelWithDynamic(proWeeks)
      ]);

      setPreWeeks(prev => {
        // Optimización: comparar solo si hay cambios reales
        if (prev.length !== newPreWeeks.length) return newPreWeeks;
        const changed = prev.some((p, i) => {
          const n = newPreWeeks[i];
          return !n || p.id !== n.id || p.label !== n.label;
        });
        return changed ? newPreWeeks : prev;
      });

      setProWeeks(prev => {
        if (prev.length !== newProWeeks.length) return newProWeeks;
        const changed = prev.some((p, i) => {
          const n = newProWeeks[i];
          return !n || p.id !== n.id || p.label !== n.label;
        });
        return changed ? newProWeeks : prev;
      });
    };

    // Usar requestIdleCallback o setTimeout para diferir el trabajo pesado
    const timeoutId = setTimeout(() => {
      updateWeeks();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, holidayKey, preWeeks.length, proWeeks.length]);

  // Sync weeks with roster
  const rosterKey = useMemo(
    () => JSON.stringify({ baseRoster, preRoster, pickRoster, refsRoster }),
    [baseRoster, preRoster, pickRoster, refsRoster]
  );

  useEffect(() => {
    setPreWeeks(prev =>
      syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
    );
    setProWeeks(prev =>
      syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
    );
  }, [rosterKey]);

  return {
    preWeeks,
    proWeeks,
    setPreWeeks,
    setProWeeks,
    openPre,
    setOpenPre,
    openPro,
    setOpenPro,
  };
}

