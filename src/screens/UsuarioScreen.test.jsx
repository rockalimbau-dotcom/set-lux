import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import UsuarioScreen from './UsuarioScreen.tsx';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

// Mock localStorage
const mockLocalStorage = {
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('UsuarioScreen', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Salir')).toBeInTheDocument();
  });

  it('renders all menu options', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
    expect(screen.getByText('Atajos de teclado')).toBeInTheDocument();
    expect(screen.getByText('Centro de ayuda / Feedback')).toBeInTheDocument();
    expect(screen.getByText('Salir')).toBeInTheDocument();
  });

  it('calls handlePerfil when Perfil is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const perfilButton = screen.getByText('Perfil');
    fireEvent.click(perfilButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Abrir perfil (pendiente de implementar)'
    );
  });

  it('calls handleConfiguracion when Configuración is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const configButton = screen.getByText('Configuración');
    fireEvent.click(configButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Abrir configuración (pendiente de implementar)'
    );
  });

  it('calls handleCambiarContraseña when Cambiar contraseña is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const passwordButton = screen.getByText('Cambiar contraseña');
    fireEvent.click(passwordButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Cambiar contraseña (pendiente de implementar)'
    );
  });

  it('calls handleAtajos when Atajos de teclado is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const shortcutsButton = screen.getByText('Atajos de teclado');
    fireEvent.click(shortcutsButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Mostrar atajos de teclado (pendiente de implementar)'
    );
  });

  it('calls handleAyuda when Centro de ayuda / Feedback is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const helpButton = screen.getByText('Centro de ayuda / Feedback');
    fireEvent.click(helpButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'Abrir centro de ayuda / feedback (pendiente de implementar)'
    );
  });

  it('handles logout when Salir is clicked', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const salirButton = screen.getByText('Salir');
    fireEvent.click(salirButton);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles logout without onClose prop', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen />
      </MemoryRouter>
    );

    const salirButton = screen.getByText('Salir');
    fireEvent.click(salirButton);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw an error
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const salirButton = screen.getByText('Salir');
    fireEvent.click(salirButton);

    // Should still navigate and call onClose even if localStorage fails
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('applies correct CSS classes', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const container = screen.getByText('Perfil').closest('div');
    expect(container).toHaveClass(
      'absolute',
      'right-6',
      'top-16',
      'w-48',
      'rounded-xl',
      'border',
      'border-neutral-border',
      'bg-neutral-panel',
      'shadow-lg',
      'z-50'
    );

    const list = screen.getByText('Perfil').closest('ul');
    expect(list).toHaveClass('text-sm', 'text-zinc-200');

    const salirButton = screen.getByText('Salir');
    expect(salirButton).toHaveClass(
      'px-4',
      'py-2',
      'hover:bg-red-500/20',
      'hover:text-red-400',
      'cursor-pointer'
    );
  });

  it('has proper accessibility attributes', () => {
    render(
      <MemoryRouter>
        <UsuarioScreen onClose={mockOnClose} />
      </MemoryRouter>
    );

    const menuItems = screen.getAllByRole('listitem');
    expect(menuItems).toHaveLength(6);

    // All items should be clickable
    menuItems.forEach(item => {
      expect(item).toHaveClass('cursor-pointer');
    });
  });
});
