import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

vi.mock('@shared/services/localStorage.service', () => ({
  storage: {
    getJSON: vi.fn(),
    setJSON: vi.fn(),
  },
}));

import { storage } from '@shared/services/localStorage.service';

describe('ProfilePage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getJSON.mockReturnValue({ name: 'Raúl', nombre: 'Raúl', apellido: '', email: 'raul@test.com', role: 'gaffer' });
  });

  it('renders header and form with loaded values', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    expect(await screen.findByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
    expect(screen.getByText('Datos de usuario')).toBeInTheDocument();

    const nombre = screen.getByPlaceholderText('Nombre') as HTMLInputElement;
    const apellido = screen.getByPlaceholderText('Apellido') as HTMLInputElement;
    const email = screen.getByPlaceholderText('tucorreo@ejemplo.com') as HTMLInputElement;
    const roleButton = screen.getByText('gaffer').closest('button');

    expect(nombre.value).toBe('Raúl');
    expect(apellido.value).toBe('');
    expect(email.value).toBe('raul@test.com');
    expect(roleButton).toBeInTheDocument();
  });

  it('saves profile and shows feedback', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    const nombre = (await screen.findByPlaceholderText('Nombre')) as HTMLInputElement;
    fireEvent.change(nombre, { target: { value: 'Nuevo' } });
    
    const apellido = screen.getByPlaceholderText('Apellido') as HTMLInputElement;
    fireEvent.change(apellido, { target: { value: 'Nombre' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(storage.setJSON).toHaveBeenCalledWith('profile_v1', {
      name: 'Nuevo Nombre',
      nombre: 'Nuevo',
      apellido: 'Nombre',
      email: 'raul@test.com',
      role: 'gaffer',
    });

    expect(screen.getByText('Perfil guardado ✓')).toBeInTheDocument();
  });

  it('has clickable SetLux breadcrumb that navigates to projects', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const setLuxButton = screen.getByText('SetLux').closest('button');
    expect(setLuxButton).toBeInTheDocument();
    expect(setLuxButton).toHaveClass('hover:underline');
  });
});


