import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { AnyRecord } from '@shared/types/common';
import { Project } from './ReportesTabTypes';

/**
 * Load weeks saved by Planning: { pre: Week[], pro: Week[] }
 */
export function usePlanWeeks(project?: Project) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'demo';
    return `plan_${base}`;
  }, [project?.id, project?.nombre]);

  const [planData] = useLocalStorage<{ pre: AnyRecord[]; pro: AnyRecord[] }>(storageKey, { pre: [], pro: [] });

  return useMemo(() => {
    return {
      pre: Array.isArray(planData.pre) ? planData.pre : [],
      pro: Array.isArray(planData.pro) ? planData.pro : [],
    };
  }, [planData]);
}

