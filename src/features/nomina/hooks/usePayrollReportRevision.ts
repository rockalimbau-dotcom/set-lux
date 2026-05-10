import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { STORAGE_CHANGE_EVENT } from '@shared/services/localStorage.service';

/** Reportes usa debounce hasta 500 ms (payload grande); los refrescos retardados deben ir después. */
const AFTER_DEBOUNCE_MS = 650;
const DEBOUNCE_SAFETY_MS = 1200;

/**
 * Invalida la “versión” de lectura de reportes para nómina cuando cambian claves relevantes en localStorage.
 * Vigila todos los prefijos dados (p. ej. `reportes_<id>_` y `reportes_<nombre>_` si ambos existen).
 */
export function usePayrollReportRevision(watchedPrefixes: string[]): number {
  const [reportsVersion, setReportsVersion] = useState(0);
  const location = useLocation();
  const prefixesRef = useRef(watchedPrefixes);
  prefixesRef.current = watchedPrefixes;

  useEffect(() => {
    const bumpIfMatch = (key?: string | null) => {
      if (!key || typeof key !== 'string') return;
      const prefs = prefixesRef.current.filter(p => typeof p === 'string' && p.length > 0);
      if (prefs.length === 0) return;
      if (prefs.some(prefix => key.startsWith(prefix))) {
        setReportsVersion(v => v + 1);
      }
    };

    const onStorage = (e: StorageEvent) => bumpIfMatch(e.key);
    const onLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      bumpIfMatch(detail?.key || null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    };
  }, []);

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

  /** Otra pestaña guardó reportes o volviste a la ventana antes de que terminara el debounce. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (!window.location.pathname.includes('/nomina')) return;
      setReportsVersion(v => v + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return reportsVersion;
}
