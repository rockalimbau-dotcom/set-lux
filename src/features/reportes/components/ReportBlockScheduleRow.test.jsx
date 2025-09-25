import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportBlockScheduleRow from './ReportBlockScheduleRow.jsx';

describe('ReportBlockScheduleRow (smoke)', () => {
  it('renders label and values', () => {
    const semana = [
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
      '2025-01-12',
    ];
    const valueForISO = () => '08:00–17:00';

    render(
      <table>
        <tbody>
          <ReportBlockScheduleRow label='Horario Prelight' semana={semana} valueForISO={valueForISO} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Horario Prelight')).toBeInTheDocument();
    expect(screen.getAllByText('08:00–17:00').length).toBeGreaterThan(0);
  });
});
