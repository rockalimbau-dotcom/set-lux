import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import CondicionesPublicidad from './publicidad.tsx';
import { storage } from '@shared/services/localStorage.service';

describe('CondicionesPublicidad (smoke)', () => {
  it('renderiza sin explotar y muestra tabla', () => {
    render(<CondicionesPublicidad project={{ id: 'p1', nombre: 'Demo' }} />);
    expect(screen.getAllByText(/rol\s*\/\s*precio/i).length).toBeGreaterThan(0);
  });

  it('incluye roles custom del catalogo en añadir rol', async () => {
    const user = userEvent.setup();
    render(
      <CondicionesPublicidad
        project={{
          id: 'p1-diario-custom',
          nombre: 'Demo',
          roleCatalog: {
            version: 1,
            roles: [
              { id: 'gaffer', label: 'Gaffer', legacyCode: 'G', baseRole: 'G', sortOrder: 0, active: true },
              { id: 'electric_default', label: 'Eléctrico/a', legacyCode: 'E', baseRole: 'E', sortOrder: 20, active: true },
              { id: 'electric_x', label: 'Eléctrico X', legacyCode: 'E', baseRole: 'E', sortOrder: 20, active: true },
            ],
          },
        }}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /añadir rol/i })[0]);
    const customRoleOption = await screen.findByRole('button', { name: 'Eléctrico X' });
    expect(customRoleOption).toBeInTheDocument();

    fireEvent.mouseDown(customRoleOption);
    expect(await screen.findByText('Eléctrico X')).toBeInTheDocument();
  });

  it('prioriza conditions del proyecto frente a localStorage viejo al reentrar', () => {
    storage.setJSON('cond_p1-diario-reload_diario', {
      roles: ['Gaffer', 'Eléctrico'],
      prices: {
        Gaffer: { 'Precio jornada': '510' },
        'Eléctrico': { 'Precio jornada': '310' },
      },
    });

    render(
      <CondicionesPublicidad
        project={{
          id: 'p1-diario-reload',
          nombre: 'Demo',
          roleCatalog: {
            version: 1,
            roles: [
              { id: 'gaffer_default', label: 'Gaffer', legacyCode: 'G', baseRole: 'G', sortOrder: 0, active: true },
              { id: 'electric_default', label: 'Eléctrico/a', legacyCode: 'E', baseRole: 'E', sortOrder: 20, active: true },
              { id: 'electric_x', label: 'Eléctrico X', legacyCode: 'E', baseRole: 'E', sortOrder: 21, active: true },
            ],
          },
          conditions: {
            tipo: 'diario',
            diario: {
              roles: ['gaffer_default', 'electric_default', 'electric_x'],
              prices: {
                gaffer_default: { 'Precio jornada': '510' },
                electric_default: { 'Precio jornada': '310' },
                electric_x: { 'Precio jornada': '777' },
              },
            },
          },
        }}
      />
    );

    expect(screen.getByText('Eléctrico X')).toBeInTheDocument();
    expect(screen.getByDisplayValue('777')).toBeInTheDocument();
  });
});
