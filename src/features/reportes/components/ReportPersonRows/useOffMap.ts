import { useMemo } from 'react';
import { AnyRecord } from '@shared/types/common';

interface UseOffMapProps {
  list: AnyRecord[];
  semana: readonly string[];
  block: 'base' | 'pre' | 'pick' | string;
  isPersonScheduledOnBlock: (
    fecha: string,
    visualRole: string,
    name: string,
    findWeekAndDay: (iso: string) => AnyRecord,
    block?: 'base' | 'pre' | 'pick' | string,
    options?: { roleId?: string }
  ) => boolean;
  findWeekAndDay: (iso: string) => AnyRecord;
}

/**
 * Hook to calculate offMap (which days a person is not working)
 */
export function useOffMap({
  list,
  semana,
  block,
  isPersonScheduledOnBlock,
  findWeekAndDay,
}: UseOffMapProps): Map<string, boolean> {
  return useMemo(() => {
    const map = new Map<string, boolean>();
    list.forEach(p => {
      const visualRole = (p as AnyRecord)?.role || '';
      const roleId = String((p as AnyRecord)?.roleId || '').trim() || undefined;
      const personId = String((p as AnyRecord)?.personId || '').trim() || undefined;
      const name = (p as AnyRecord)?.name || '';
      semana.forEach(fecha => {
        try {
          const isRef =
            visualRole === 'REF' ||
            (visualRole && visualRole.startsWith('REF') && visualRole.length > 3);
          const blockForCheck =
            block && block !== 'base'
              ? (block as any)
              : isRef
              ? 'base'
              : undefined;
          const workedThisBlock = isPersonScheduledOnBlock(
            fecha,
            visualRole,
            name,
            findWeekAndDay,
            blockForCheck,
            { roleId }
          );
          const key = `${roleId || personId || visualRole}_${name}_${fecha}_${block}`;
          map.set(key, !workedThisBlock);
        } catch (e) {
          // Si hay un error, asumir que no trabaja
          const key = `${roleId || personId || visualRole}_${name}_${fecha}_${block}`;
          map.set(key, true);
        }
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Serializar y ordenar list para comparación estable
    JSON.stringify(
      list
        .map((p: AnyRecord) => ({ personId: p?.personId || '', roleId: p?.roleId || '', role: p?.role || '', name: p?.name || '' }))
        .sort((a, b) => {
          const aKey = `${a.roleId || a.personId || a.role}_${a.name}`;
          const bKey = `${b.roleId || b.personId || b.role}_${b.name}`;
          return aKey.localeCompare(bKey);
        })
    ),
    // Serializar semana para comparación estable
    JSON.stringify(semana),
    // block es primitivo, comparación directa
    block,
    // NO incluir: data, horasExtraTipo, findWeekAndDay, isPersonScheduledOnBlock
  ]);
}
