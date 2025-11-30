import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';

vi.mock('@shared/services/localStorage.service', () => ({
  storage: {
    getJSON: vi.fn(),
    setJSON: vi.fn(),
  },
}));

import { storage } from '@shared/services/localStorage.service';

describe('SettingsPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getJSON.mockReturnValue({ theme: 'dark', language: 'es' });
  });

  it('renders header and loads settings', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(await screen.findByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
    expect(screen.getByText('Preferencias')).toBeInTheDocument();

    const select = screen.getByDisplayValue('Oscuro') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // Comprobamos que existen selects de Tema e Idioma
    expect(screen.getByLabelText('Tema')).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
  });

  it('saves settings and shows feedback', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    const select = screen.getByDisplayValue('Oscuro') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'light' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(storage.setJSON).toHaveBeenCalledWith('settings_v1', {
      theme: 'light',
      language: 'es',
    });

    expect(screen.getByText('Configuración guardada ✓')).toBeInTheDocument();
  });

  it('has clickable SetLux breadcrumb that navigates to projects', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    const setLuxButton = screen.getByText('SetLux').closest('button');
    expect(setLuxButton).toBeInTheDocument();
    expect(setLuxButton).toHaveClass('hover:underline');
  });
});


