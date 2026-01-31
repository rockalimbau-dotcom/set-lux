import React, { useMemo } from 'react';
import { Td } from '@shared/components';
import { useTranslation } from 'react-i18next';

type Props = {
  label: string;
  semana: readonly string[];
  valueForISO: (iso: string) => string;
};

function ReportBlockScheduleRow({ label, semana, valueForISO }: Props) {
  const { t } = useTranslation();
  if (!Array.isArray(semana) || semana.length === 0) return null;
  const values = useMemo(() => semana.map(iso => valueForISO(iso)), [semana, valueForISO]);
  
  // Translate label if it matches known patterns
  const translatedLabel = label === 'Horario Prelight' 
    ? t('reports.prelightSchedule')
    : label === 'Horario Recogida'
    ? t('reports.pickupSchedule')
    : label;
  
  return (
    <tr className='schedule-row'>
      <Td className='whitespace-nowrap align-middle bg-white/5' align='middle'>
        <div className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-zinc-200 flex items-center'>{translatedLabel}</div>
      </Td>
      {semana.map((iso, i) => (
        <Td key={`sched_${label}_${iso}`} className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-center align-middle bg-white/5 whitespace-nowrap' align='middle'>
          <div className='flex items-center justify-center'>{values[i]}</div>
        </Td>
      ))}
      <Td className='text-center align-middle bg-white/5' align='middle'>&nbsp;</Td>
    </tr>
  );
}

export default React.memo(ReportBlockScheduleRow);
