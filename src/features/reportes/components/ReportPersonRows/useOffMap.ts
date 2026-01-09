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
    block?: 'base' | 'pre' | 'pick' | string
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
      const name = (p as AnyRecord)?.name || '';
      semana.forEach(fecha => {
        try {
          const workedThisBlock = isPersonScheduledOnBlock(
            fecha,
            visualRole,
            name,
            findWeekAndDay,
            (visualRole === 'REF' || (visualRole && visualRole.startsWith('REF') && visualRole.length > 3)) ? (block as any) || 'base' : undefined
          );
          const key = `${visualRole}_${name}_${fecha}_${block}`;
          map.set(key, !workedThisBlock);
        } catch (e) {
          // Si hay un error, asumir que no trabaja
          const key = `${visualRole}_${name}_${fecha}_${block}`;
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
        .map((p: AnyRecord) => ({ role: p?.role || '', name: p?.name || '' }))
        .sort((a, b) => {
          const aKey = `${a.role}_${a.name}`;
          const bKey = `${b.role}_${b.name}`;
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

