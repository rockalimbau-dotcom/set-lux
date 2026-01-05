import { useEffect, useMemo, useState } from 'react';
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

  // Sincronizar cambios de semanas de vuelta a weeksData
  useEffect(() => {
    if (!isLoaded) return;
    setWeeksData({ pre: preWeeks, pro: proWeeks });
  }, [preWeeks, proWeeks, isLoaded, setWeeksData]);

  // Relabel weeks with holidays
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
        const next = newPreWeeks;
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });

      setProWeeks(prev => {
        const next = newProWeeks;
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
    };

    updateWeeks();
  }, [isLoaded, holidayFull, holidayMD, preWeeks, proWeeks]);

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

