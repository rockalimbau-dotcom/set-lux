import { render, screen } from '@testing-library/react';
import React from 'react';

import DietasSummary from './DietasSummary.tsx';

describe('DietasSummary (smoke)', () => {
  it('muestra total y conteos con ticket', () => {
    const map = new Map();
    map.set('Comida', 2);
    map.set('Cena', 1);
    render(<DietasSummary dietasCount={map} ticketTotal={12.5} otherTotal={0} />);

    // Verificar que el total aparece (2 + 1 + 1 ticket = 4)
    expect(screen.getByText('4')).toBeInTheDocument();

    // Verificar que las píldoras aparecen
    expect(screen.getByText(/comida x2/i)).toBeInTheDocument();
    expect(screen.getByText(/cena x1/i)).toBeInTheDocument();
    expect(screen.getByText(/ticket €12\.50/i)).toBeInTheDocument();
  });

  it('muestra solo total cuando no hay dietas', () => {
    const map = new Map();
    render(<DietasSummary dietasCount={map} ticketTotal={0} otherTotal={0} />);

    // No debería mostrar nada cuando no hay dietas
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
