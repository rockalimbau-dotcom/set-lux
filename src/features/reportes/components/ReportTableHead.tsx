import React, { useMemo } from 'react';
import { Th } from '@shared/components';

type Props = {
  semana: readonly string[];
  dayNameFromISO: (iso: string, i: number, dayNames: readonly string[]) => string;
  DAY_NAMES: readonly string[];
  toDisplayDate: (iso: string) => string;
  horarioTexto: (iso: string) => string;
};

function ReportTableHead({
  semana,
  dayNameFromISO,
  DAY_NAMES,
  toDisplayDate,
  horarioTexto,
}: Props) {
  const dayNames = useMemo(() => semana.map((iso, i) => dayNameFromISO(iso, i, DAY_NAMES)), [semana, DAY_NAMES, dayNameFromISO]);
  const dates = useMemo(() => semana.map(iso => toDisplayDate(iso)), [semana, toDisplayDate]);
  const horarios = useMemo(() => semana.map(iso => horarioTexto(iso)), [semana, horarioTexto]);

  return (
    <thead>
      <tr>
        <Th aria-label='Persona' scope='col' />
        {semana.map((iso, i) => (
          <Th key={`dname_${iso}`} scope='col'>
            {dayNames[i]}
          </Th>
        ))}
        <Th scope='col' className='font-bold whitespace-nowrap'>Total</Th>
      </tr>

      <tr>
        <Th scope='col'>Fecha</Th>
        {semana.map((iso, i) => (
          <Th key={`fecha_${iso}`} scope='col'>
            {dates[i]}
          </Th>
        ))}
        <Th scope='col' className='whitespace-nowrap'>Semana</Th>
      </tr>

      <tr>
        <Th scope='col'>Horario</Th>
        {semana.map((iso, i) => (
          <Th key={`hor_${iso}`} scope='col'>
            {horarios[i]}
          </Th>
        ))}
        <Th scope='col'>&nbsp;</Th>
      </tr>
    </thead>
  );
}

export default React.memo(ReportTableHead);
