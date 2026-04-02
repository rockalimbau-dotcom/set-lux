import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import CondicionesSemanal from './semanal.tsx';

describe('CondicionesSemanal (smoke)', () => {
  it('renderiza sin explotar (muestra parámetros)', () => {
    render(<CondicionesSemanal project={{ id: 'p1', nombre: 'Demo' }} />);
    // Texto común que aparece en la sección de parámetros
    expect(screen.getByText(/parámetros de cálculo/i)).toBeInTheDocument();
  });

  it('muestra roles custom del catalogo en añadir rol y los añade a la tabla', async () => {
    const user = userEvent.setup();
    render(
      <CondicionesSemanal
        project={{
          id: 'p1-semanal-custom',
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
