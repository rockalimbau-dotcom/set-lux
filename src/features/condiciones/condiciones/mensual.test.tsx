import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import CondicionesMensual from './mensual.tsx';

describe('CondicionesMensual (smoke)', () => {
  it('renderiza sin explotar y muestra tabla', () => {
    render(<CondicionesMensual project={{ id: 'p1', nombre: 'Demo' }} />);
    // Busca cabecera común de la tabla
    expect(screen.getAllByText(/rol\s*\/\s*precio/i).length).toBeGreaterThan(0);
  });

  it('incluye roles custom del catalogo en añadir rol', async () => {
    const user = userEvent.setup();
    render(
      <CondicionesMensual
        project={{
          id: 'p1-mensual-custom',
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
});
