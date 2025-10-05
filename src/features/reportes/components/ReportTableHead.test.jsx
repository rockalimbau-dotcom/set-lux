import { render, screen } from '@testing-library/react';
import React from 'react';

import ReportTableHead from './ReportTableHead.jsx';

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const dayNameFromISO = (iso, i, names) => names[i % names.length];
const toDisplayDate = iso => iso;
const horarioTexto = () => '08:00–17:00';

describe('ReportTableHead (smoke)', () => {
  it('renders headers for week', () => {
    const semana = [
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
      '2025-01-12',
    ];

    render(
      <table>
        <ReportTableHead
          semana={semana}
          dayNameFromISO={dayNameFromISO}
          DAY_NAMES={DAY_NAMES}
          toDisplayDate={toDisplayDate}
          horarioTexto={horarioTexto}
        />
      </table>
    );

    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Horario')).toBeInTheDocument();
  });
});
