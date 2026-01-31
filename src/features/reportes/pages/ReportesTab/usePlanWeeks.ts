import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { AnyRecord } from '@shared/types/common';
import { Project } from './ReportesTabTypes';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';

/**
 * Load weeks saved by Needs (adapted to plan shape): { pre: Week[], pro: Week[] }
 */
export function usePlanWeeks(project?: Project) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'demo';
    return `needs_${base}`;
  }, [project?.id, project?.nombre]);

  const [needsData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, { pre: [], pro: [] });

  return useMemo(() => {
    return needsDataToPlanData(needsData as AnyRecord);
  }, [needsData]);
}

