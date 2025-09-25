import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    storage.getJSON.mockReturnValue({ theme: 'dark', chunkWarn: true });
  });

  it('renders header and loads settings', async () => {
    render(<SettingsPage />);
    expect(await screen.findByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Preferencias')).toBeInTheDocument();

    const select = screen.getByDisplayValue('Oscuro') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('saves settings and shows feedback', () => {
    render(<SettingsPage />);

    const select = screen.getByDisplayValue('Oscuro') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'light' } });

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByText('Guardar'));

    expect(storage.setJSON).toHaveBeenCalledWith('settings_v1', {
      theme: 'light',
      chunkWarn: false,
    });

    expect(screen.getByText('Configuración guardada ✓')).toBeInTheDocument();
  });

  it('has a back link to projects', () => {
    render(<SettingsPage />);
    const back = screen.getByText('Volver') as HTMLAnchorElement;
    expect(back).toBeInTheDocument();
    expect(back.getAttribute('href')).toBe('/projects');
  });
});


