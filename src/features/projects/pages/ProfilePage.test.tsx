import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    storage.getJSON.mockReturnValue({ name: 'Raúl', email: 'raul@test.com', role: 'gaffer' });
  });

  it('renders header and form with loaded values', async () => {
    render(<ProfilePage />);

    expect(await screen.findByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Datos de usuario')).toBeInTheDocument();

    const name = screen.getByPlaceholderText('Tu nombre') as HTMLInputElement;
    const email = screen.getByPlaceholderText('tucorreo@ejemplo.com') as HTMLInputElement;
    const role = screen.getByPlaceholderText('Tu rol') as HTMLInputElement;

    expect(name.value).toBe('Raúl');
    expect(email.value).toBe('raul@test.com');
    expect(role.value).toBe('gaffer');
  });

  it('saves profile and shows feedback', async () => {
    render(<ProfilePage />);

    const name = (await screen.findByPlaceholderText('Tu nombre')) as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'Nuevo Nombre' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(storage.setJSON).toHaveBeenCalledWith('profile_v1', {
      name: 'Nuevo Nombre',
      email: 'raul@test.com',
      role: 'gaffer',
    });

    expect(screen.getByText('Perfil guardado ✓')).toBeInTheDocument();
  });

  it('has a back link to projects', () => {
    render(<ProfilePage />);
    const back = screen.getByText('Volver') as HTMLAnchorElement;
    expect(back).toBeInTheDocument();
    expect(back.getAttribute('href')).toBe('/projects');
  });
});


