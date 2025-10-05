import { render, screen } from '@testing-library/react';
import React from 'react';

import CondicionesMensual from './mensual.tsx';

describe('CondicionesMensual (smoke)', () => {
  it('renderiza sin explotar y muestra tabla', () => {
    render(<CondicionesMensual project={{ id: 'p1', nombre: 'Demo' }} />);
    // Busca cabecera común de la tabla
    expect(screen.getByText(/rol\s*\/\s*precio/i)).toBeInTheDocument();
  });
});
