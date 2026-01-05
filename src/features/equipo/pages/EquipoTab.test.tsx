import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import EquipoTab from './EquipoTab.jsx';

// Mock useLocalStorage to avoid touching real storage and control initial state
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, initialValue) => {
    const [value, setValue] = React.useState(
      initialValue instanceof Function ? initialValue() : initialValue
    );
    return [value, setValue];
  }),
}));

// Mock roles constants if needed by render
vi.mock('@shared/constants/roles', () => ({
  ROLE_COLORS: {
    E: { bg: '#222', fg: '#fff' },
    G: { bg: '#333', fg: '#fff' },
    BB: { bg: '#333', fg: '#fff' },
    REF: { bg: '#222', fg: '#fff' },
  },
  ROLES: [
    { code: 'E', label: 'Eléctrico' },
    { code: 'REF', label: 'Refuerzo' },
  ],
  roleRank: code => (code === 'REF' ? 2 : 1),
}));

describe('EquipoTab (smoke)', () => {
  const bossUser = { name: 'Jefe', role: 'G' };

  it('renderiza secciones básicas y botones de grupos opcionales', () => {
    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{ base: [], reinforcements: [], prelight: [], pickup: [] }}
        allowEditOverride
        storageKey={'test-equipo'}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Equipo base' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Refuerzos' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Tip:/i)).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: '+ Prelight' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Recogida' })
    ).toBeInTheDocument();
  });

  it('permite activar y eliminar el grupo Prelight', () => {
    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{ base: [], reinforcements: [] }}
        allowEditOverride
        storageKey={'test-equipo-2'}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Prelight' }));
    // Hay múltiples elementos con "Equipo Prelight", usar getAllByText y verificar que existe
    const prelightElements = screen.getAllByText('Equipo Prelight');
    expect(prelightElements.length).toBeGreaterThan(0);

    // Ahora hay un modal de confirmación, primero hacer clic en "Quitar grupo"
    fireEvent.click(screen.getByRole('button', { name: 'Quitar grupo' }));
    
    // Buscar el botón "Sí" del modal de confirmación
    const confirmButton = screen.getByText('Sí');
    expect(confirmButton).toBeInTheDocument();
    
    // Confirmar la eliminación
    fireEvent.click(confirmButton);
    
    // Verificar que el grupo se eliminó (usar queryAllByText para evitar error de múltiples elementos)
    const prelightElementsAfter = screen.queryAllByText('Equipo Prelight');
    expect(prelightElementsAfter.length).toBe(0);
  });
});
