import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProjectsScreen from './ProjectsScreen.tsx';

// Mock props
const mockProps = {
  userName: 'Test User',
  projects: [
    {
      id: 'project-1',
      nombre: 'Proyecto 1',
      dop: 'Director 1',
      almacen: 'Almacén A',
      productora: 'Productora X',
      estado: 'Activo',
      conditions: { tipo: 'semanal' },
    },
    {
      id: 'project-2',
      nombre: 'Proyecto 2',
      dop: 'Director 2',
      almacen: 'Almacén B',
      productora: 'Productora Y',
      estado: 'Cerrado',
      conditions: { tipo: 'mensual' },
    },
  ],
  onCreateProject: vi.fn(),
  onOpen: vi.fn(),
  onUpdateProject: vi.fn(),
  onPerfil: vi.fn(),
  onConfig: vi.fn(),
  onSalir: vi.fn(),
  onOpenUsuario: vi.fn(),
};

describe('ProjectsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ProjectsScreen {...mockProps} />);
    expect(screen.getByText('SetLux')).toBeInTheDocument();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
  });

  it('displays user name and welcome message', () => {
    render(<ProjectsScreen {...mockProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/Bienvenido,/)).toBeInTheDocument();
    expect(screen.getByText(/✨/)).toBeInTheDocument();
  });

  it('renders projects list with details', () => {
    render(<ProjectsScreen {...mockProps} />);

    expect(screen.getByText('Proyecto 1')).toBeInTheDocument();
    expect(screen.getByText('Proyecto 2')).toBeInTheDocument();
    expect(screen.getByText(/Director 1/)).toBeInTheDocument();
    expect(screen.getByText(/Almacén A/)).toBeInTheDocument();
    expect(screen.getByText(/Productora X/)).toBeInTheDocument();
  });

  it('shows create project button', () => {
    render(<ProjectsScreen {...mockProps} />);
    expect(screen.getByText('Nuevo proyecto')).toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    const emptyProps = { ...mockProps, projects: [] };
    render(<ProjectsScreen {...emptyProps} />);

    // Should show the large + button for empty state
    const addButtons = screen.getAllByText('Nuevo proyecto');
    expect(addButtons).toHaveLength(1);
  });

  it('opens new project modal when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const createButton = screen.getAllByText('Nuevo proyecto')[0];
    await user.click(createButton);

    expect(screen.getAllByText('Nuevo proyecto')).toHaveLength(2);
    expect(screen.getByText('Crear')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('creates new project when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    // Open modal
    const createButton = screen.getAllByText('Nuevo proyecto')[0];
    await user.click(createButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Crear')).toBeInTheDocument();
    });

    // Fill form - get the first input (Proyecto field) by label
    const nombreInput = screen.getByLabelText('Proyecto');
    await user.type(nombreInput, 'Nuevo Proyecto');

    // Verify the input has the value
    expect(nombreInput).toHaveValue('Nuevo Proyecto');

    // Submit form
    const createBtn = screen.getByText('Crear');
    await user.click(createBtn);

    // Verify that onCreateProject was called with the correct data
    expect(mockProps.onCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Nuevo Proyecto',
        dop: '',
        almacen: '',
        productora: '',
        estado: 'Activo',
        conditions: {
          tipo: 'semanal',
        },
      })
    );
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const editButtons = screen.getAllByText('Editar');
    await user.click(editButtons[0]);

    expect(screen.getByText('Editar proyecto')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Proyecto 1')).toBeInTheDocument();
  });

  it('updates project when edit form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    // Open edit modal
    const editButtons = screen.getAllByText('Editar');
    await user.click(editButtons[0]);

    // Modify project name
    const nombreInput = screen.getByDisplayValue('Proyecto 1');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Proyecto Modificado');

    // Submit form
    const saveBtn = screen.getByText('Guardar cambios');
    await user.click(saveBtn);

    expect(mockProps.onUpdateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'project-1',
        nombre: 'Proyecto Modificado',
      })
    );
  });

  it('opens project when project card is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const projectCard = screen
      .getByText('Proyecto 1')
      .closest('[role="button"]');
    await user.click(projectCard);

    expect(mockProps.onOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'project-1',
        nombre: 'Proyecto 1',
      })
    );
  });

  it('opens user menu when user name is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const userNameButton = screen.getByText('Test User');
    await user.click(userNameButton);

    expect(screen.getByText('👤 Perfil')).toBeInTheDocument();
    expect(screen.getByText('⚙️ Configuración')).toBeInTheDocument();
    expect(screen.getByText('🚪 Salir')).toBeInTheDocument();
  });

  it('shows user menu options when user name is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    // Open user menu
    const userNameButton = screen.getByText('Test User');
    await user.click(userNameButton);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByText('👤 Perfil')).toBeInTheDocument();
    });

    // Verify menu options are visible
    expect(screen.getByText('👤 Perfil')).toBeInTheDocument();
    expect(screen.getByText('⚙️ Configuración')).toBeInTheDocument();
    expect(screen.getByText('🚪 Salir')).toBeInTheDocument();
  });

  it('calls onSalir when Salir is clicked in user menu', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    // Open user menu
    const userNameButton = screen.getByText('Test User');
    await user.click(userNameButton);

    // Click Salir
    const salirButton = screen.getByText('🚪 Salir');
    await user.click(salirButton);

    expect(mockProps.onSalir).toHaveBeenCalled();
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    // Open modal
    const createButton = screen.getByText('Nuevo proyecto');
    await user.click(createButton);

    // Click cancel
    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(screen.queryByText('Editar proyecto')).not.toBeInTheDocument();
  });

  it('formats project mode correctly', () => {
    render(<ProjectsScreen {...mockProps} />);

    expect(screen.getByText(/Semanal/)).toBeInTheDocument();
    expect(screen.getByText(/Mensual/)).toBeInTheDocument();
  });

  it('handles keyboard navigation for project cards', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const projectCard = screen
      .getByText('Proyecto 1')
      .closest('[role="button"]');
    projectCard.focus();

    // Press Enter
    await user.keyboard('{Enter}');
    expect(mockProps.onOpen).toHaveBeenCalled();

    // Press Space
    await user.keyboard(' ');
    expect(mockProps.onOpen).toHaveBeenCalledTimes(2);
  });

  it('prevents event propagation when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectsScreen {...mockProps} />);

    const editButton = screen.getAllByText('Editar')[0];
    await user.click(editButton);

    // Should open edit modal but not trigger project open
    expect(screen.getByText('Editar proyecto')).toBeInTheDocument();
    expect(mockProps.onOpen).not.toHaveBeenCalled();
  });
});
