import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { parseYYYYMMDD } from './NecesidadesTabUtils';
import { WeekEntry } from './NecesidadesTabTypes';

interface UseNeedsDataProps {
  needs: AnyRecord;
  storageKey: string;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
  setHasError: (hasError: boolean) => void;
  setErrorMessage: (message: string) => void;
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
}: UseNeedsDataProps) {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const migrationDoneRef = useRef<string | null>(null);

  // Data migration - only run once per storageKey
  useEffect(() => {
    // Skip if migration already done for this storageKey
    if (migrationDoneRef.current === storageKey) {
      setIsLoaded(true);
      return;
    }

    // Ejecutar migración de forma asíncrona para no bloquear el render
    const performMigration = () => {
      try {
        const raw = JSON.stringify(needs);
        if (raw && raw !== '{}') {
          const parsed: AnyRecord = JSON.parse(raw) || {};
          let needsMigration = false;
          
          for (const wk of Object.values(parsed)) {
            const week = wk as AnyRecord;
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
              delete (d as AnyRecord).crewNames;
              delete (d as AnyRecord).preNames;
              delete (d as AnyRecord).pickNames;
            }
          }
          
          // Only update if migration was needed
          if (needsMigration) {
            setNeeds(() => parsed);
          }
        }
        migrationDoneRef.current = storageKey;
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
  const weekEntries = useMemo(() => {
    try {
      return Object.entries(needs as AnyRecord).sort(([, a], [, b]) => {
        const dateA = parseYYYYMMDD((a as AnyRecord).startDate);
        const dateB = parseYYYYMMDD((b as AnyRecord).startDate);
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error sorting week entries:', error);
      return [];
    }
  }, [needs]);

  return { isLoaded, weekEntries };
}

