import { useMemo } from 'react';
import { AnyRecord } from '@shared/types/common';
import { isMemberRefuerzo } from '../../utils/plan';
import { norm } from '../../utils/text';

interface UsePersonScheduledCheckerProps {
  findWeekAndDay: (iso: string) => AnyRecord;
}

/**
 * Hook to create a function that checks if a person is scheduled on a block
 */
export function usePersonScheduledChecker({
  findWeekAndDay,
}: UsePersonScheduledCheckerProps) {
  return useMemo(
    () => (iso: string, role: string, name: string, findFn: any) => {
      const { day } = findFn(iso);
      if (!day || day.tipo === 'Descanso') return false;
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
      const roleStr = String(role || '');
      if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
        const any = (arr: AnyRecord[]) =>
          (arr || []).some(
            m =>
              String(m?.name || '') === String(name || '') &&
              isMemberRefuerzo(m)
          );
        return any(day.team) || any(day.prelight) || any(day.pickup);
      }
      const baseRole = String(role || '').replace(/[PR]$/, '');
      const suffix = /P$/.test(role || '')
        ? 'prelight'
        : /R$/.test(role || '')
          ? 'pickup'
          : 'team';
      const list = Array.isArray(day[suffix]) ? day[suffix] : [];
      return list.some(
        (m: AnyRecord) =>
          norm(m?.name) === norm(name) &&
          (!m?.role || norm(m?.role) === norm(baseRole) || !baseRole)
      );
    },
    [findWeekAndDay]
  );
}

