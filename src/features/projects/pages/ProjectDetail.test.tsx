import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import ProjectDetail from './ProjectDetail.tsx';

function renderWithRouter(ui, { route = '/project/abc' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path='/project/:id/*' element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectDetail (smoke)', () => {
  const baseProject = {
    id: 'abc',
    nombre: 'Proyecto Demo',
    estado: 'Activo',
    team: {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    },
    conditions: { tipo: 'semanal' },
  };
  const user = { nombreCompleto: 'User Test', roleCode: 'ADMIN' };

  it('renders title and phase cards', () => {
    renderWithRouter(
      <ProjectDetail project={baseProject} user={user} onBack={() => {}} />
    );

    expect(
      screen.getByRole('heading', { name: /Proyecto Demo/ })
    ).toBeInTheDocument();

    // Phase cards (select label text and assert the wrapping button exists)
    expect(screen.getByText('Equipo').closest('button')).toBeInTheDocument();
    expect(
      screen.getByText('Planificación').closest('button')
    ).toBeInTheDocument();
    expect(screen.getByText('Reportes').closest('button')).toBeInTheDocument();
    expect(screen.getByText('Nómina').closest('button')).toBeInTheDocument();
    expect(
      screen.getByText('Necesidades de rodaje').closest('button')
    ).toBeInTheDocument();
    expect(screen.getByText(/Condiciones/)).toBeInTheDocument();

    // Breadcrumb navigation exists
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
  });
});
