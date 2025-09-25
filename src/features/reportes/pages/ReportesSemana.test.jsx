import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportesSemana from './ReportesSemana.jsx';

describe('ReportesSemana (smoke)', () => {
  it('renders header and table for a week', () => {
    const project = { id: 'p3', nombre: 'Proyecto 3' };
    const semana = [
      '2025-01-06',
      '2025-01-07',
      '2025-01-08',
      '2025-01-09',
      '2025-01-10',
      '2025-01-11',
      '2025-01-12',
    ];
    const personas = [{ id: 'EL__Juan', role: 'EL', name: 'Juan' }];

    render(
      <ReportesSemana
        project={project}
        title='Semana X'
        semana={semana}
        personas={personas}
      />
    );

    expect(screen.getByText('Semana X')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
