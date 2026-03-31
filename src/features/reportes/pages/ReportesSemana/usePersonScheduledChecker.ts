import { useMemo } from 'react';
import { AnyRecord } from '@shared/types/common';
import { BLOCKS, getDayBlockList, isMemberRefuerzo } from '../../utils/plan';
import { stripRoleSuffix } from '@shared/constants/roles';
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
    () => (iso: string, role: string, name: string, findFn: any, block?: 'base' | 'pre' | 'pick' | 'extra') => {
      const { day } = findFn(iso);
      if (!day || day.tipo === 'Descanso') return false;
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
      const roleStr = String(role || '');
      if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
        const matchesRef = (members: AnyRecord[]) =>
          (members || []).some(
            member =>
              String(member?.name || '') === String(name || '') &&
              isMemberRefuerzo(member)
          );
        if (block) return matchesRef(getDayBlockList(day, block));
        return (
          matchesRef(getDayBlockList(day, BLOCKS.base)) ||
          matchesRef(getDayBlockList(day, BLOCKS.pre)) ||
          matchesRef(getDayBlockList(day, BLOCKS.pick)) ||
          matchesRef(getDayBlockList(day, BLOCKS.extra))
        );
      }
      const resolvedBlock = block
        ? block
        : /P$/i.test(role || '')
        ? BLOCKS.pre
        : /R$/i.test(role || '')
        ? BLOCKS.pick
        : BLOCKS.base;
      const baseRole = stripRoleSuffix(String(role || ''));
      const list = getDayBlockList(day, resolvedBlock);
      return list.some(
        (m: AnyRecord) =>
          norm(m?.name) === norm(name) &&
          (!m?.role || norm(stripRoleSuffix(String(m?.role || ''))) === norm(baseRole) || !baseRole)
      );
    },
    [findWeekAndDay]
  );
}
