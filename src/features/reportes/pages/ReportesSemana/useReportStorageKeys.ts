import { useMemo } from 'react';

interface UseReportStorageKeysProps {
  project: { id?: string; nombre?: string } | undefined;
  safeSemana: string[];
}

interface UseReportStorageKeysReturn {
  storageKey: string;
  persistBase: string;
}

/**
 * Hook to generate storage keys for report data
 */
export function useReportStorageKeys({
  project,
  safeSemana,
}: UseReportStorageKeysProps): UseReportStorageKeysReturn {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    return `reportes_${base}_${wk}`;
  }, [project?.id, project?.nombre, safeSemana]);

  const persistBase = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    const wk = safeSemana.join('_');
    return `repstate_${base}_${wk}`;
  }, [project?.id, project?.nombre, safeSemana]);

  return { storageKey, persistBase };
}

