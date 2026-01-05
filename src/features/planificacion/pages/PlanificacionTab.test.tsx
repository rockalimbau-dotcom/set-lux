import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import PlanificacionTab from './PlanificacionTab.tsx';

vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, initialValue) => {
    const [value, setValue] = React.useState(
      initialValue instanceof Function ? initialValue() : initialValue
    );
    return [value, setValue];
  }),
}));

describe('PlanificacionTab (smoke)', () => {
  const project = { id: 'p1', nombre: 'Proyecto Test' };

  it('renders and shows empty hints and Exportar TODO', () => {
    render(
      <PlanificacionTab project={project} conditions={{}} teamList={[]} />
    );

    expect(
      screen.getByRole('button', { name: /PDF Entero/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/No hay semanas de preproducción/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No hay semanas de producción/i)
    ).toBeInTheDocument();
  });
});
