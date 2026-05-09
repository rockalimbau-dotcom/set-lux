import { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { STORAGE_CHANGE_EVENT } from '@shared/services/localStorage.service';

/** Reportes usa debounce hasta 500 ms (payload grande); los refrescos retardados deben ir después. */
const AFTER_DEBOUNCE_MS = 650;
const DEBOUNCE_SAFETY_MS = 1200;

/**
 * Invalida la “versión” de lectura de reportes para nómina cuando:
 * - Cambia el JSON de reportes en localStorage (misma pestaña u otra)
 * - Entras en la ruta de nómina (SPA): primera lectura puede ser anterior al debounce de useLocalStorage en Reportes
 * - Ticks retardados tras el máximo debounce (500 ms) para no leer JSON aún no guardado
 */
export function usePayrollReportRevision(
  reportsKeyPrefix: string,
  extraWatchedPrefixes: string[] = []
): number {
  const [reportsVersion, setReportsVersion] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const bumpIfReportsKey = (key?: string | null) => {
      if (!key || typeof key !== 'string') return;
      const matchesReportPrefix = key.startsWith(reportsKeyPrefix);
      const matchesExtraPrefix = extraWatchedPrefixes.some(prefix =>
        prefix ? key.startsWith(prefix) : false
      );
      if (!matchesReportPrefix && !matchesExtraPrefix) return;
      setReportsVersion(v => v + 1);
    };

    const onStorage = (e: StorageEvent) => bumpIfReportsKey(e.key);
    const onLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      bumpIfReportsKey(detail?.key || null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    };
  }, [reportsKeyPrefix, extraWatchedPrefixes]);

  useLayoutEffect(() => {
    if (!location.pathname.includes('/nomina')) return;
    setReportsVersion(v => v + 1);
  }, [location.pathname]);

  useEffect(() => {
    if (!location.pathname.includes('/nomina')) return;
    const a = window.setTimeout(() => setReportsVersion(v => v + 1), AFTER_DEBOUNCE_MS);
    const b = window.setTimeout(() => setReportsVersion(v => v + 1), DEBOUNCE_SAFETY_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [location.pathname]);

  return reportsVersion;
}
