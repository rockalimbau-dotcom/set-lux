import React, { useMemo } from 'react';
import { Td } from '@shared/components';

type Props = {
  label: string;
  semana: readonly string[];
  valueForISO: (iso: string) => string;
};

function ReportBlockScheduleRow({ label, semana, valueForISO }: Props) {
  if (!Array.isArray(semana) || semana.length === 0) return null;
  const values = useMemo(() => semana.map(iso => valueForISO(iso)), [semana, valueForISO]);
  return (
    <tr>
      <Td className='whitespace-nowrap align-middle'>
        <div className='text-sm font-semibold text-zinc-200'>{label}</div>
      </Td>
      {semana.map((iso, i) => (
        <Td key={`sched_${label}_${iso}`} className='text-sm font-semibold'>
          {values[i]}
        </Td>
      ))}
    </tr>
  );
}

export default React.memo(ReportBlockScheduleRow);
