import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import NominaTab from './NominaTab.jsx';

describe('NominaTab (smoke)', () => {
  it('renderiza el mensaje vacío de nómina mensual', () => {
    render(
      <MemoryRouter>
        <NominaTab project={{ id: 'p1', nombre: 'Demo' }} />
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Configura el proyecto/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Añade semanas en/i)
    ).toBeInTheDocument();
  });
});
