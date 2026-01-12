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
    () => (iso: string, role: string, name: string, findFn: any, block?: 'base' | 'pre' | 'pick') => {
      const { day } = findFn(iso);
      if (!day || day.tipo === 'Descanso') return false;
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
      const roleStr = String(role || '');
      if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
        // Si se proporciona block, buscar solo en ese bloque específico
        if (block === 'pre') {
          return Array.isArray(day.prelight) ? day.prelight.some(
            m => String(m?.name || '') === String(name || '') && isMemberRefuerzo(m)
          ) : false;
        }
        if (block === 'pick') {
          return Array.isArray(day.pickup) ? day.pickup.some(
            m => String(m?.name || '') === String(name || '') && isMemberRefuerzo(m)
          ) : false;
        }
        // block === 'base' o undefined: buscar en todos los bloques
        const any = (arr: AnyRecord[]) =>
          (arr || []).some(
            m =>
              String(m?.name || '') === String(name || '') &&
              isMemberRefuerzo(m)
          );
        return any(day.team) || any(day.prelight) || any(day.pickup);
      }
      // Determinar el bloque a buscar basado en el parámetro block o el sufijo del rol
      let suffix: 'team' | 'prelight' | 'pickup';
      if (block === 'pre') {
        suffix = 'prelight';
      } else if (block === 'pick') {
        suffix = 'pickup';
      } else {
        // Si no se especifica block, usar el sufijo del rol
        suffix = /P$/.test(role || '')
          ? 'prelight'
          : /R$/.test(role || '')
            ? 'pickup'
            : 'team';
      }
      const baseRole = String(role || '').replace(/[PR]$/, '');
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

