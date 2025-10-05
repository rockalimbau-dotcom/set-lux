import { render, screen } from '@testing-library/react';
import React from 'react';

import CondicionesPublicidad from './publicidad.tsx';

describe('CondicionesPublicidad (smoke)', () => {
  it('renderiza sin explotar y muestra tabla', () => {
    render(<CondicionesPublicidad project={{ id: 'p1', nombre: 'Demo' }} />);
    expect(screen.getByText(/rol\s*\/\s*precio/i)).toBeInTheDocument();
  });
});
