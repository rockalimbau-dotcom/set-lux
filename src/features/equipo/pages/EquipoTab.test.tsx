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
  ROLE_ORDER: ['G', 'BB', 'E', 'REF'],
  ROLE_CODE_TO_LABEL: {
    G: 'Gaffer',
    BB: 'Best Boy',
    E: 'Eléctrico',
    REF: 'Refuerzo',
  },
  ROLES: [
    { code: 'G', label: 'Gaffer' },
    { code: 'BB', label: 'Best Boy' },
    { code: 'E', label: 'Eléctrico' },
    { code: 'REF', label: 'Refuerzo' },
  ],
  hasRoleGroupSuffix: code => /[PR]$/i.test(String(code || '')),
  stripRefuerzoSuffix: code => String(code || '').replace(/[PR]$/i, ''),
  stripRoleSuffix: code => String(code || '').replace(/[PR]$/i, ''),
  getRoleBadgeCode: code => String(code || ''),
  applyGenderToBadge: (badge: string) => badge,
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
      screen.getByRole('heading', { name: 'Equipo extra / Dif horarios' })
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

  it('usa el roleCatalog del proyecto para mostrar roles personalizados', () => {
    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{
          base: [{ id: '1', role: 'E', roleId: 'electric_premium', name: 'Ana' }],
          reinforcements: [],
          prelight: [],
          pickup: [],
        }}
        allowEditOverride
        storageKey={'test-equipo-3'}
        project={{
          id: 'p1',
          nombre: 'Demo',
          roleCatalog: {
            version: 1,
            roles: [
              {
                id: 'electric_premium',
                label: 'Eléctrico premium',
                legacyCode: 'E',
                baseRole: 'E',
                sortOrder: 10,
                active: true,
                supportsPrelight: true,
                supportsPickup: true,
                supportsRefuerzo: true,
              },
            ],
          },
        }}
      />
    );

    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargo' })).toHaveTextContent('Eléctrico premium');
  });

  it('mantiene roleId en el payload onChange al editar una fila existente', () => {
    const handleChange = vi.fn();

    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{
          base: [{ id: '1', role: 'E', roleId: 'electric_premium', name: 'Ana' }],
          reinforcements: [],
          prelight: [],
          pickup: [],
        }}
        onChange={handleChange}
        allowEditOverride
        storageKey={'test-equipo-4'}
        project={{
          id: 'p1',
          nombre: 'Demo',
          roleCatalog: {
            version: 1,
            roles: [
              {
                id: 'electric_premium',
                label: 'Eléctrico premium',
                legacyCode: 'E',
                baseRole: 'E',
                sortOrder: 10,
                active: true,
                supportsPrelight: true,
                supportsPickup: true,
                supportsRefuerzo: true,
              },
            ],
          },
        }}
      />
    );

    fireEvent.change(screen.getByDisplayValue('Ana'), { target: { value: 'Ana Maria' } });

    const lastCall = handleChange.mock.calls.at(-1)?.[0];
    expect(lastCall.base[0].name).toBe('Ana Maria');
    expect(lastCall.base[0].role).toBe('E');
    expect(lastCall.base[0].roleId).toBe('electric_premium');
    expect(lastCall.base[0].personId).toBeTruthy();
  });

  it('genera personId estable para filas legacy que no lo tenían', () => {
    const handleChange = vi.fn();

    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{
          base: [{ id: '1', role: 'E', name: 'Ana' }],
          reinforcements: [],
          prelight: [],
          pickup: [],
        }}
        onChange={handleChange}
        allowEditOverride
        storageKey={'test-equipo-legacy-personid'}
      />
    );

    fireEvent.change(screen.getByDisplayValue('Ana'), { target: { value: 'Ana Maria' } });

    const lastCall = handleChange.mock.calls.at(-1)?.[0];
    expect(lastCall.base[0].personId).toBeTruthy();
  });

  it('reutiliza el mismo personId cuando el mismo nombre existe en varios equipos', () => {
    const handleChange = vi.fn();

    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{
          base: [{ id: '1', role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' }],
          reinforcements: [],
          prelight: [],
          pickup: [{ id: '2', role: 'E', roleId: 'electric_factura', personId: 'other_id', name: 'Pol Peitx' }],
          enabledGroups: { prelight: false, pickup: true },
        }}
        onChange={handleChange}
        allowEditOverride
        storageKey={'test-equipo-person-shared'}
      />
    );

    fireEvent.change(screen.getAllByDisplayValue('Pol Peitx')[0], { target: { value: 'Pol Peitx ' } });

    const lastCall = handleChange.mock.calls.at(-1)?.[0];
    expect(lastCall.base[0].personId).toBe('person_pol');
    expect(lastCall.pickup[0].personId).toBe('person_pol');
  });

  it('permite crear un rol editable desde la misma fila de equipo', () => {
    const handleRoleCatalogChange = vi.fn();

    render(
      <EquipoTab
        currentUser={bossUser}
        initialTeam={{
          base: [{ id: '1', role: 'G', name: 'Ana' }],
          reinforcements: [],
          prelight: [],
          pickup: [],
        }}
        onRoleCatalogChange={handleRoleCatalogChange}
        allowEditOverride
        storageKey={'test-equipo-5'}
        project={{
          id: 'p1',
          nombre: 'Demo',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar|team\.editRoleShort/i }));
    fireEvent.change(screen.getByDisplayValue('Gaffer'), { target: { value: 'Gaffer noche' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar|common\.save/i }));

    const lastCall = handleRoleCatalogChange.mock.calls.at(-1)?.[0];
    expect(lastCall.roles.some((role: any) => role.label === 'Gaffer noche')).toBe(true);
  });
});
