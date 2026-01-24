import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AppRouter from './AppRouter.tsx';
import type { Project } from '../../features/projects/types';

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
    Routes: ({ children }: { children: ReactNode }) => <div data-testid='routes'>{children}</div>,
    Route: ({ element }: { element: ReactNode }) => <div data-testid='route'>{element}</div>,
    Navigate: () => <div data-testid='navigate'>Navigate</div>,
  };
});

// Mock ProjectDetail and ProjectsScreen
vi.mock('../../features/projects/pages/ProjectDetail.tsx', () => ({
  __esModule: true,
  default: ({ project, onBack }: { project: Project | null; onBack: () => void }) => (
    <div data-testid='project-detail'>
      <div>Project: {project?.nombre || 'No project'}</div>
      <button onClick={onBack} data-testid='back-button'>
        Back
      </button>
    </div>
  ),
}));

vi.mock('../../features/projects/pages/ProjectsScreen.tsx', () => ({
  __esModule: true,
  default: ({
    userName,
    projects,
    onCreateProject,
    onOpen,
  }: {
    userName: string;
    projects: Project[];
    onCreateProject: (project: Project) => void;
    onOpen: (project: Project) => void;
  }) => (
    <div data-testid='projects-screen'>
      <div>User: {userName}</div>
      <div>Projects: {projects.length}</div>
      <button
        onClick={() => onCreateProject({ id: 'new', nombre: 'New Project', estado: 'Activo' })}
        data-testid='create-project'
      >
        Create
      </button>
      <button
        onClick={() => onOpen({ id: '1', nombre: 'Test Project', estado: 'Activo' })}
        data-testid='open-project'
      >
        Open
      </button>
    </div>
  ),
}));

describe('AppRouter', () => {
  const mockProps = {
    mode: 'login',
    setMode: vi.fn(),
    userName: 'Test User',
    projects: [],
    setProjects: vi.fn(),
    activeProject: null,
    setActiveProject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'test-project-1' });
    mockUseLocation.mockReturnValue({ pathname: '/projects' });
  });

  it('renders without crashing', async () => {
    render(
      <MemoryRouter>
        <AppRouter {...mockProps} />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('projects-screen')).toBeInTheDocument();
  });

  it('renders ProjectsScreen when mode is projects', () => {
    const propsWithProjectsMode = { ...mockProps, mode: 'projects' };

    render(
      <MemoryRouter>
        <AppRouter {...propsWithProjectsMode} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('projects-screen')).toBeInTheDocument();
  });

  it('renders ProjectsScreen when on projects path', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/projects' });

    render(
      <MemoryRouter>
        <AppRouter {...mockProps} />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('projects-screen')).toBeInTheDocument();
  });

  it('renders nothing while lazy loads when on project path with no active project', async () => {
    mockUseLocation.mockReturnValue({ pathname: '/project/test-project-1' });
    const propsWithProjectMode = { ...mockProps, mode: 'project' };

    render(
      <MemoryRouter>
        <AppRouter {...propsWithProjectMode} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('project-detail')).not.toBeInTheDocument();
    });
  });

  it('renders ProjectDetail when project is active', async () => {
    const activeProject: Project = { id: 'test-project-1', nombre: 'Test Project', estado: 'Activo' };
    const propsWithActiveProject = {
      ...mockProps,
      mode: 'project',
      activeProject,
    };
    mockUseLocation.mockReturnValue({ pathname: '/project/test-project-1' });

    render(
      <MemoryRouter>
        <AppRouter {...propsWithActiveProject} />
      </MemoryRouter>
    );

    // Check that project-detail exists (there might be multiple routes)
    expect(
      (await screen.findAllByTestId('project-detail')).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText('Project: Test Project')).length
    ).toBeGreaterThan(0);
  });

  it('handles project creation', () => {
    const propsWithProjectsMode = { ...mockProps, mode: 'projects' };

    render(
      <MemoryRouter>
        <AppRouter {...propsWithProjectsMode} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('create-project'));
    expect(mockProps.setProjects).toHaveBeenCalled();
  });

  it('handles project opening', () => {
    const propsWithProjectsMode = { ...mockProps, mode: 'projects' };

    render(
      <MemoryRouter>
        <AppRouter {...propsWithProjectsMode} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('open-project'));
    expect(mockProps.setActiveProject).toHaveBeenCalled();
    expect(mockProps.setMode).toHaveBeenCalledWith('project');
    expect(mockNavigate).toHaveBeenCalledWith('/project/1');
  });
});
