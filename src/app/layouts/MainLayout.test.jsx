import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import MainLayout from './MainLayout.tsx';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockUseLocation = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useLocation: () => mockUseLocation(),
    NavLink: ({ children, to, className, end }) => (
      <a href={to} className={className} data-end={end}>
        {children}
      </a>
    ),
    Outlet: () => <div data-testid='outlet'>Outlet Content</div>,
  };
});

describe('MainLayout', () => {
  const mockProject = {
    id: 'test-project-1',
    nombre: 'Test Project',
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'test-project-1' });
    mockUseLocation.mockReturnValue({ pathname: '/project/test-project-1' });
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('← Volver a proyectos')).toBeInTheDocument();
  });

  it('displays project name correctly', () => {
    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows navigation links when not on index page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/project/test-project-1/planificacion',
    });

    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.getByText('Planificación')).toBeInTheDocument();
    expect(screen.getByText('Equipo')).toBeInTheDocument();
    expect(screen.getByText('Necesidades')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Nómina')).toBeInTheDocument();
  });

  it('hides navigation links when on index page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/project/test-project-1' });

    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Planificación')).not.toBeInTheDocument();
    expect(screen.queryByText('Equipo')).not.toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('← Volver a proyectos'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders outlet content', () => {
    render(
      <BrowserRouter>
        <MainLayout project={mockProject} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('handles missing project gracefully', () => {
    render(
      <BrowserRouter>
        <MainLayout project={null} onBack={mockOnBack} />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Proyecto')).toHaveLength(2); // Label and fallback text
  });
});
