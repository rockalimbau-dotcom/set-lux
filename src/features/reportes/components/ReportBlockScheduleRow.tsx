import React, { useMemo } from 'react';
import { Th } from '@shared/components';
import { useTranslation } from 'react-i18next';

type Props = {
  label: string;
  semana: readonly string[];
  valueForISO: (iso: string) => string;
  block?: string;
  getDayStyle?: (iso: string, block?: string) => React.CSSProperties | undefined;
  stickyTop?: number;
};

function ReportBlockScheduleRow({ label, semana, valueForISO, block = 'base', getDayStyle, stickyTop = 0 }: Props) {
  const { t } = useTranslation();
  if (!Array.isArray(semana) || semana.length === 0) return null;
  const values = useMemo(() => semana.map(iso => valueForISO(iso)), [semana, valueForISO]);
  const restLabel = t('reports.rest');
  
  // Translate label if it matches known patterns
  const translatedLabel = label === 'Horario Prelight' || label === 'Horario Equipo Prelight'
    ? t('reports.prelightSchedule')
    : label === 'Horario Recogida' || label === 'Horario Equipo Recogida'
    ? t('reports.pickupSchedule')
    : label;
  
  return (
    <tr
      className='schedule-row report-sticky-row report-sticky-row--block'
      style={{ ['--report-sticky-row-top' as string]: `${stickyTop}px` }}
    >
      <Th
        scope='row'
        className='align-middle bg-white/5 report-sticky-first-col'
        align='middle'
      >
        <div className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-zinc-200 flex items-center whitespace-normal break-words leading-tight'>
          {translatedLabel}
        </div>
      </Th>
      {semana.map((iso, i) => (
        <Th
          key={`sched_${label}_${iso}`}
          scope='col'
          className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-center align-middle bg-white/5 ${
            getDayStyle ? 'report-jornada-cell' : ''
          } ${
            values[i] === restLabel ? 'report-rest-cell' : ''
          }`}
          align='middle'
          style={getDayStyle?.(iso, block)}
        >
          <div
            className={`flex items-center justify-center whitespace-normal break-words leading-tight text-center min-h-[1.5rem] ${
              values[i] === restLabel ? 'report-rest-cell__content' : ''
            }`}
          >
            {values[i]}
          </div>
        </Th>
      ))}
      <Th
        scope='col'
        className='text-center align-middle bg-white/5'
        align='middle'
      >
        &nbsp;
      </Th>
    </tr>
  );
}

export default React.memo(ReportBlockScheduleRow);
