import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { parseYYYYMMDD } from './NecesidadesTabUtils';
import { relabelNeedsWeekByCalendar, relabelNeedsWeekByCalendarDynamic } from '../../utils/calendar';
import { NeedsState, NeedsWeek } from './NecesidadesTabTypes';

interface UseNeedsDataProps {
  needs: AnyRecord;
  storageKey: string;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
  setHasError: (hasError: boolean) => void;
  setErrorMessage: (message: string) => void;
  holidayFull?: Set<string>;
  holidayMD?: Set<string>;
}

/**
 * Hook for managing needs data and migration
 */
export function useNeedsData({
  needs,
  storageKey,
  setNeeds,
  setHasError,
  setErrorMessage,
  holidayFull = new Set(),
  holidayMD = new Set(),
}: UseNeedsDataProps) {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const stateRef = useRef<{ migrationKey: string | null; needs: AnyRecord } | null>(null);
  if (!stateRef.current) {
    stateRef.current = { migrationKey: null, needs: needs as AnyRecord };
  } else {
    stateRef.current.needs = needs as AnyRecord;
  }

  const normalizeNeeds = (raw: AnyRecord): NeedsState => {
    if (raw && Array.isArray(raw.pre) && Array.isArray(raw.pro)) {
      return {
        pre: (raw.pre as AnyRecord[]).map(w => ({
          ...(w as AnyRecord),
          id: (w as AnyRecord).id || `${Math.random()}`,
        })) as NeedsWeek[],
        pro: (raw.pro as AnyRecord[]).map(w => ({
          ...(w as AnyRecord),
          id: (w as AnyRecord).id || `${Math.random()}`,
        })) as NeedsWeek[],
      };
    }

    const next: NeedsState = { pre: [], pro: [] };
    const entries = Object.entries(raw || {}).filter(([key]) => key !== 'pre' && key !== 'pro');
    for (const [wid, wk] of entries) {
      const week = { ...(wk as AnyRecord), id: (wk as AnyRecord).id || wid } as NeedsWeek;
      const label = String(week.label || '');
      const isPre = /-\d+/.test(label);
      if (isPre) {
        next.pre.push(week);
      } else {
        next.pro.push(week);
      }
    }
    return next;
  };

  const sortWeeks = (weeks: NeedsWeek[]) =>
    [...weeks].sort((a, b) => {
      const dateA = parseYYYYMMDD((a as AnyRecord).startDate);
      const dateB = parseYYYYMMDD((b as AnyRecord).startDate);
      return dateA.getTime() - dateB.getTime();
    });

  // Data migration - only run once per storageKey
  useEffect(() => {
    // Skip if migration already done for this storageKey
    if (stateRef.current?.migrationKey === storageKey) {
      setIsLoaded(true);
      return;
    }

    // Ejecutar migración de forma asíncrona para no bloquear el render
    const performMigration = () => {
      try {
        const raw = JSON.stringify(needs);
        if (raw && raw !== '{}') {
          const parsed: AnyRecord = JSON.parse(raw) || {};
          const normalized = normalizeNeeds(parsed);
          let needsMigration = false;

          const allWeeks = [...normalized.pre, ...normalized.pro];
          for (const week of allWeeks) {
            if (!week?.days) continue;
            for (let i = 0; i < 7; i++) {
              const d = (week.days as AnyRecord[])[i];
              if (!d) continue;
              
              // Check if migration is needed
              if ((d as AnyRecord).crewNames || (d as AnyRecord).preNames || (d as AnyRecord).pickNames) {
                needsMigration = true;
              }
              
              const migrateList = (arr: unknown, keyFromV1: string) => {
                try {
                  const v: unknown = (d as AnyRecord)[keyFromV1];
                  if (Array.isArray(v) && v.length && typeof v[0] === 'string') {
                    return (v as string[]).map(name => ({ role: '', name }));
                  }
                  if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
                    return v as AnyRecord[];
                  }
                  return Array.isArray(v) ? (v as AnyRecord[]) : [];
                } catch (error) {
                  console.error('Error migrating list:', error);
                  return [];
                }
              };
              (d as AnyRecord).crewList = migrateList((d as AnyRecord).crewNames, 'crewNames') || (d as AnyRecord).crewList || [];
              (d as AnyRecord).preList = migrateList((d as AnyRecord).preNames, 'preNames') || (d as AnyRecord).preList || [];
              (d as AnyRecord).pickList = migrateList((d as AnyRecord).pickNames, 'pickNames') || (d as AnyRecord).pickList || [];
              if ((d as AnyRecord).preTipo && !(d as AnyRecord).prelightTipo) {
                (d as AnyRecord).prelightTipo = (d as AnyRecord).preTipo;
                delete (d as AnyRecord).preTipo;
              }
              if ((d as AnyRecord).pickTipo && !(d as AnyRecord).pickupTipo) {
                (d as AnyRecord).pickupTipo = (d as AnyRecord).pickTipo;
                delete (d as AnyRecord).pickTipo;
              }
              delete (d as AnyRecord).crewNames;
              delete (d as AnyRecord).preNames;
              delete (d as AnyRecord).pickNames;
            }
          }
          
          // Only update if migration was needed or structure changed
          if (needsMigration || !Array.isArray(parsed.pre) || !Array.isArray(parsed.pro)) {
            setNeeds(() => normalized as AnyRecord);
          }
        }
        if (stateRef.current) {
          stateRef.current.migrationKey = storageKey;
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Error migrating needs data:', error);
        setHasError(true);
        setErrorMessage(t('needs.errorMigratingData'));
        setIsLoaded(true);
      }
    };
    
    // Usar requestIdleCallback si está disponible, sino setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(performMigration, { timeout: 1000 });
    } else {
      setTimeout(performMigration, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Sort week entries by date
  const { preEntries, proEntries } = useMemo(() => {
    try {
      const normalized = normalizeNeeds(needs as AnyRecord);
      return {
        preEntries: sortWeeks(normalized.pre),
        proEntries: sortWeeks(normalized.pro),
      };
    } catch (error) {
      console.error('Error sorting week entries:', error);
      return { preEntries: [], proEntries: [] };
    }
  }, [needs]);

  const holidayKey = useMemo(
    () => `${holidayFull.size}_${holidayMD.size}`,
    [holidayFull, holidayMD]
  );

  useEffect(() => {
    if (!isLoaded) return;

    const relabelWithDynamic = async (weeks: NeedsWeek[]) =>
      Promise.all(
        (weeks || []).map(async w => {
          try {
            return await relabelNeedsWeekByCalendarDynamic(w, w.startDate || '', holidayFull, holidayMD);
          } catch {
            return relabelNeedsWeekByCalendar(w, w.startDate || '', holidayFull, holidayMD);
          }
        })
      );

    const hasWeekChanges = (prevWeeks: NeedsWeek[], nextWeeks: NeedsWeek[]) => {
      if (prevWeeks.length !== nextWeeks.length) return true;
      return prevWeeks.some((w, idx) => {
        const n = nextWeeks[idx];
        if (!n) return true;
        if (w.id !== n.id || w.label !== n.label || w.startDate !== n.startDate) return true;
        const wDays = Array.isArray(w.days) ? w.days : [];
        const nDays = Array.isArray(n.days) ? n.days : [];
        if (wDays.length !== nDays.length) return true;
        return wDays.some((d, i) => {
          const nd = nDays[i] || {};
          return (d as AnyRecord)?.crewTipo !== (nd as AnyRecord)?.crewTipo;
        });
      });
    };

    const updateWeeks = async () => {
      const normalized = normalizeNeeds((stateRef.current?.needs ?? {}) as AnyRecord);
      const [newPreWeeks, newProWeeks] = await Promise.all([
        relabelWithDynamic(sortWeeks(normalized.pre)),
        relabelWithDynamic(sortWeeks(normalized.pro)),
      ]);

      setNeeds(prev => {
        const prevNormalized = normalizeNeeds(prev as AnyRecord);
        const prevPre = sortWeeks(prevNormalized.pre);
        const prevPro = sortWeeks(prevNormalized.pro);
        const changed = hasWeekChanges(prevPre, newPreWeeks) || hasWeekChanges(prevPro, newProWeeks);
        if (!changed) return prev;
        return {
          ...prev,
          pre: newPreWeeks,
          pro: newProWeeks,
        } as AnyRecord;
      });
    };

    const timeoutId = setTimeout(() => {
      updateWeeks();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, holidayKey, holidayFull, holidayMD, setNeeds]);

  return { isLoaded, preEntries, proEntries };
}

