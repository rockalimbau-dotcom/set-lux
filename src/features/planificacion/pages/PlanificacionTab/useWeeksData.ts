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
    
    // Comparar contenido completo para detectar cambios reales
    const currentWeeks = { pre: preWeeks, pro: proWeeks };
    const prevWeeks = prevWeeksRef.current;
    
    if (prevWeeks) {
      // Comparar estructura y contenido
      const preChanged = prevWeeks.pre.length !== currentWeeks.pre.length ||
        prevWeeks.pre.some((w, i) => {
          const current = currentWeeks.pre[i];
          if (!current || w.id !== current.id) return true;
          // Comparar días
          if ((w.days || []).length !== (current.days || []).length) return true;
          return (w.days || []).some((d: AnyRecord, di: number) => {
            const cd = (current.days || [])[di];
            if (!cd) return true;
            // Comparar campos importantes
            return d.tipo !== cd.tipo ||
              JSON.stringify(d.team || []) !== JSON.stringify(cd.team || []) ||
              JSON.stringify(d.prelight || []) !== JSON.stringify(cd.prelight || []) ||
              JSON.stringify(d.pickup || []) !== JSON.stringify(cd.pickup || []) ||
              d.start !== cd.start ||
              d.end !== cd.end ||
              d.cut !== cd.cut ||
              d.observations !== cd.observations ||
              d.loc !== cd.loc ||
              d.issue !== cd.issue ||
              d.prelightStart !== cd.prelightStart ||
              d.prelightEnd !== cd.prelightEnd ||
              d.pickupStart !== cd.pickupStart ||
              d.pickupEnd !== cd.pickupEnd;
          });
        });
      
      const proChanged = prevWeeks.pro.length !== currentWeeks.pro.length ||
        prevWeeks.pro.some((w, i) => {
          const current = currentWeeks.pro[i];
          if (!current || w.id !== current.id) return true;
          // Comparar días
          if ((w.days || []).length !== (current.days || []).length) return true;
          return (w.days || []).some((d: AnyRecord, di: number) => {
            const cd = (current.days || [])[di];
            if (!cd) return true;
            // Comparar campos importantes
            return d.tipo !== cd.tipo ||
              JSON.stringify(d.team || []) !== JSON.stringify(cd.team || []) ||
              JSON.stringify(d.prelight || []) !== JSON.stringify(cd.prelight || []) ||
              JSON.stringify(d.pickup || []) !== JSON.stringify(cd.pickup || []) ||
              d.start !== cd.start ||
              d.end !== cd.end ||
              d.cut !== cd.cut ||
              d.observations !== cd.observations ||
              d.loc !== cd.loc ||
              d.issue !== cd.issue ||
              d.prelightStart !== cd.prelightStart ||
              d.prelightEnd !== cd.prelightEnd ||
              d.pickupStart !== cd.pickupStart ||
              d.pickupEnd !== cd.pickupEnd;
          });
        });
      
      if (!preChanged && !proChanged) {
        // No hay cambios reales, no escribir
        return;
      }
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
    // Solo ejecutar cuando cambian los holidays, no cuando cambia la longitud de las semanas
    const timeoutId = setTimeout(() => {
      updateWeeks();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, holidayKey]);

  // Sync weeks with roster - solo cuando cambia el roster realmente
  const rosterKey = useMemo(
    () => JSON.stringify({ baseRoster, preRoster, pickRoster, refsRoster }),
    [baseRoster, preRoster, pickRoster, refsRoster]
  );
  
  const prevRosterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Solo sincronizar si el roster realmente cambió (no en cada render)
    const currentRosterKey = rosterKey;
    const prevRosterKey = prevRosterKeyRef.current;
    
    // Si es la primera vez o el roster realmente cambió
    if (prevRosterKey === null || prevRosterKey !== currentRosterKey) {
      prevRosterKeyRef.current = currentRosterKey;
      
      // Solo sincronizar si el roster cambió (no en la primera carga si ya hay datos)
      if (prevRosterKey !== null) {
        // El roster cambió, sincronizar
        setPreWeeks(prev =>
          syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
        );
        setProWeeks(prev =>
          syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
        );
      } else {
        // Primera carga: solo sincronizar si no hay datos guardados
        if ((weeksData.pre || []).length === 0 && (weeksData.pro || []).length === 0) {
          setPreWeeks(prev =>
            syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
          );
          setProWeeks(prev =>
            syncAllWeeks(prev, baseRoster, preRoster, pickRoster, refsRoster)
          );
        }
      }
    }
  }, [isLoaded, rosterKey, baseRoster, preRoster, pickRoster, refsRoster, weeksData]);

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

