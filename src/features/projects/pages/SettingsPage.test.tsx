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
    storage.getJSON.mockImplementation((key: string) => {
      if (key === 'settings_v1') {
        return { theme: 'dark' };
      }
      if (key === 'profile_v1') {
        return { idioma: 'Español' };
      }
      return {};
    });
  });

  it('renders header and loads settings', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(await screen.findByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
    expect(screen.getByText('Preferencias')).toBeInTheDocument();

    // Ahora son botones personalizados, no selects
    const themeButton = screen.getByText('Oscuro');
    expect(themeButton).toBeInTheDocument();

    // Comprobamos que existen labels de Tema e Idioma
    expect(screen.getByLabelText('Tema')).toBeInTheDocument();
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
  });

  it('saves settings and shows feedback', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    // Ahora es un botón personalizado, necesitamos hacer clic para abrir el dropdown y luego seleccionar
    const themeButton = screen.getByText('Oscuro');
    fireEvent.click(themeButton);
    
    // Seleccionar "Claro" del dropdown
    const claroOption = screen.getByText('Claro');
    fireEvent.click(claroOption);

    fireEvent.click(screen.getByText('Guardar'));

    // Verificar que se guarda el tema en settings_v1
    expect(storage.setJSON).toHaveBeenCalledWith('settings_v1', {
      theme: 'light',
    });
    
    // Verificar que se guarda el idioma en profile_v1
    expect(storage.setJSON).toHaveBeenCalledWith('profile_v1', expect.objectContaining({
      idioma: expect.any(String),
    }));

    expect(screen.getByText('Configuración guardada ✓')).toBeInTheDocument();
  });

  it('has clickable SetLux breadcrumb that navigates to projects', () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    const setLuxButton = screen.getByText('SetLux').closest('button');
    expect(setLuxButton).toBeInTheDocument();
    expect(setLuxButton).toHaveClass('hover:underline');
  });
});


