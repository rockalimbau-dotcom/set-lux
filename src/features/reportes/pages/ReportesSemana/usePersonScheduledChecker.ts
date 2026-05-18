import { useMemo } from 'react';
import { AnyRecord } from '@shared/types/common';
import { BLOCKS, isPersonScheduledOnBlock } from '../../utils/plan';
import { getExtraBlockCount } from '../../utils/extra';

interface UsePersonScheduledCheckerProps {
  findWeekAndDay: (iso: string) => AnyRecord;
}

/**
 * Bloques a comprobar según la columna de reporte y el rol (P/R).
 * Para columna base (o block undefined) incluye extra:N dinámicos: alguien puede estar solo en Carga ese día.
 */
function blocksToScan(day: AnyRecord | null | undefined, role: string, block?: string): string[] {
  if (block && block !== 'base') {
    return [block];
  }
  if (/P$/i.test(role || '')) return [BLOCKS.pre];
  if (/R$/i.test(role || '')) return [BLOCKS.pick];
  const out = [BLOCKS.base, BLOCKS.pre, BLOCKS.pick, BLOCKS.extra];
  const n = getExtraBlockCount(day || {});
  for (let i = 0; i < n; i++) {
    out.push(`extra:${i}`);
  }
  return out;
}

/**
 * Comprueba si la persona está en el plan en alguno de los bloques relevantes para esa fila.
 */
export function usePersonScheduledChecker({ findWeekAndDay }: UsePersonScheduledCheckerProps) {
  return useMemo(
    () =>
      (
        iso: string,
        role: string,
        name: string,
        findFn: (arg: string) => AnyRecord,
        block?: string,
        options?: { roleId?: string }
      ) => {
        const { day } = findFn(iso);
        if (!day || day.tipo === 'Descanso') return false;
        return blocksToScan(day, role, block).some(b =>
          isPersonScheduledOnBlock(iso, role, name, findFn as any, b, options)
        );
      },
    [findWeekAndDay]
  );
}
