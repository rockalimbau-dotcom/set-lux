import React, { useMemo } from 'react';
import { Th } from '@shared/components';
import { useTranslation } from 'react-i18next';

type Props = {
  semana: readonly string[];
  dayNameFromISO: (iso: string, i: number, dayNames: readonly string[]) => string;
  DAY_NAMES: readonly string[];
  toDisplayDate: (iso: string) => string;
  horarioTexto: (iso: string) => string;
  headerRowRef?: React.RefObject<HTMLTableRowElement | null>;
  dateRowRef?: React.RefObject<HTMLTableRowElement | null>;
  headerTop?: number;
  dateTop?: number;
};

function ReportTableHead({
  semana,
  dayNameFromISO,
  DAY_NAMES,
  toDisplayDate,
  horarioTexto,
  headerRowRef,
  dateRowRef,
  headerTop = 0,
  dateTop = 0,
}: Props) {
  const { t } = useTranslation();
  const dayNames = useMemo(() => semana.map((iso, i) => dayNameFromISO(iso, i, DAY_NAMES)), [semana, DAY_NAMES, dayNameFromISO]);
  const dates = useMemo(() => semana.map(iso => toDisplayDate(iso)), [semana, toDisplayDate]);
  const horarios = useMemo(() => semana.map(iso => horarioTexto(iso)), [semana, horarioTexto]);

  return (
    <thead>
      <tr
        ref={headerRowRef}
        className='report-sticky-row report-sticky-row--header'
        style={{ ['--report-sticky-row-top' as string]: `${headerTop}px` }}
      >
        <Th aria-label={t('reports.person')} scope='col' align='left' className='report-sticky-first-col' />
        {semana.map((iso, i) => (
          <Th key={`dname_${iso}`} scope='col' align='center'>
            {dayNames[i]}
          </Th>
        ))}
        <Th scope='col' className='font-bold whitespace-nowrap' align='center'>{t('reports.total')}</Th>
      </tr>

      <tr
        ref={dateRowRef}
        className='report-sticky-row report-sticky-row--date'
        style={{ ['--report-sticky-row-top' as string]: `${dateTop}px` }}
      >
        <Th scope='col' align='left' className='report-sticky-first-col'>{t('reports.date')}</Th>
        {semana.map((iso, i) => (
          <Th key={`fecha_${iso}`} scope='col' align='center'>
            {dates[i]}
          </Th>
        ))}
        <Th scope='col' className='whitespace-nowrap' align='center'>{t('reports.week')}</Th>
      </tr>

      <tr>
        <Th scope='col' align='left' className='report-sticky-first-col'>{t('reports.scheduleBase')}</Th>
        {semana.map((iso, i) => (
          <Th key={`hor_${iso}`} scope='col' align='center'>
            {horarios[i]}
          </Th>
        ))}
        <Th scope='col' align='center'>&nbsp;</Th>
      </tr>
    </thead>
  );
}

export default React.memo(ReportTableHead);
