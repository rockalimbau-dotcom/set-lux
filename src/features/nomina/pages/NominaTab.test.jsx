import { render, screen } from '@testing-library/react';
import React from 'react';

import NominaTab from './NominaTab.jsx';

describe('NominaTab (smoke)', () => {
  it('renderiza el mensaje vacío de nómina mensual', () => {
    render(<NominaTab project={{ id: 'p1', nombre: 'Demo' }} />);
    expect(
      screen.getByText(/no hay semanas en planificación/i)
    ).toBeInTheDocument();
  });
});
