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
    <tr className='schedule-row'>
      <Td className='whitespace-nowrap align-middle bg-white/5' align='middle'>
        <div className='text-sm font-semibold text-zinc-200 flex items-center'>{label}</div>
      </Td>
      {semana.map((iso, i) => (
        <Td key={`sched_${label}_${iso}`} className='text-sm font-semibold text-center align-middle bg-white/5' align='middle'>
          <div className='flex items-center justify-center'>{values[i]}</div>
        </Td>
      ))}
      <Td className='text-center align-middle bg-white/5' align='middle'>&nbsp;</Td>
    </tr>
  );
}

export default React.memo(ReportBlockScheduleRow);
