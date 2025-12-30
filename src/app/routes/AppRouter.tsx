import React from 'react';
import {
  useNavigate,
  useParams,
  useLocation,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

const ProjectDetail = React.lazy(() => import('../../features/projects/pages/ProjectDetail.tsx'));
const ProjectsScreen = React.lazy(() => import('../../features/projects/pages/ProjectsScreen.tsx'));
import { storage } from '../../shared/services/localStorage.service';
import type { Project as UIProject } from '../../features/projects/pages/ProjectsScreen.tsx';
const ProfilePage = React.lazy(() => import('../../features/projects/pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('../../features/projects/pages/SettingsPage'));
import { ErrorBoundary } from '../../shared/components';

// Local Project interface removed in favor of UIProject from ProjectsScreen

interface AppRouterProps {
  mode: string;
  setMode: (mode: string) => void;
  userName: string | null;
  projects: UIProject[];
  setProjects: (projects: UIProject[] | ((prev: UIProject[]) => UIProject[])) => void;
  activeProject: UIProject | null;
  setActiveProject: (project: UIProject | null) => void;
}


export default function AppRouter({
  mode,
  setMode,
  userName,
  projects,
  setProjects,
  activeProject,
  setActiveProject,
}: AppRouterProps) {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const isProjectsPath = location.pathname === '/projects';
  const isProjectPath = location.pathname.startsWith('/project/');

  // Alinea el modo con la ruta actual al recargar
  React.useEffect(() => {
    if (isProjectsPath && mode !== 'projects') setMode('projects');
    else if (isProjectPath && mode !== 'project') setMode('project');
    else if (!isProjectsPath && !isProjectPath && mode !== 'login')
      setMode('login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectsPath, isProjectPath]);

  // Hidrata project por id si venimos directo a /project/:id
  React.useEffect(() => {
    if (mode !== 'project') return;
    if (activeProject) return;
    const pid = params.id;
    if (!pid) return;
    const list = Array.isArray(projects) ? projects : [];
    let found = list.find(p => String(p?.id) === String(pid));
    if (!found) {
      try {
        const fromLS = storage.getJSON<any[]>('projects_v1') || [];
        found = (Array.isArray(fromLS) ? fromLS : []).find(
          p => String(p?.id) === String(pid)
        );
      } catch {}
    }
    if (found) setActiveProject(found);
  }, [mode, activeProject, params.id, projects, setActiveProject]);

  if (isProjectsPath || mode === 'projects') {
    return (
      <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12'>
        <ErrorBoundary>
          <React.Suspense fallback={null}>
          <ProjectsScreen
            userName={userName || 'Usuario'}
            projects={projects}
            onCreateProject={(p: UIProject) => {
              const makeId = () =>
                globalThis.crypto?.randomUUID
                  ? globalThis.crypto.randomUUID()
                  : Math.random().toString(36).slice(2);
              const id = p?.id || makeId();
              const proj: UIProject = { ...p, id };
              setProjects((prev: UIProject[]) => [proj, ...(prev || [])]);
            }}
            onOpen={(p: UIProject) => {
              const ensureId = () =>
                globalThis.crypto?.randomUUID
                  ? globalThis.crypto.randomUUID()
                  : Math.random().toString(36).slice(2);
              const id = p?.id || ensureId();
              const proj: UIProject = { ...p, id };
              setActiveProject(proj);
              // si faltaba id, actualiza la lista en memoria
              if (!p?.id) {
                setProjects((prev: UIProject[]) => {
                  const rest = Array.isArray(prev) ? prev.filter(x => x !== p) : [];
                  return [proj, ...rest];
                });
              }
              setMode('project');
              const pid = proj.id;
              navigate(`/project/${pid}`);
            }}
            onUpdateProject={(updatedProject: UIProject) => {
              setProjects((prev: UIProject[]) => {
                if (!Array.isArray(prev)) return [updatedProject];
                return prev.map((p: UIProject) => 
                  p.id === updatedProject.id ? updatedProject : p
                );
              });
            }}
            onDeleteProject={(projectId: string) => {
              setProjects((prev: UIProject[]) => (Array.isArray(prev) ? prev.filter((x: UIProject) => x?.id !== projectId) : prev));
            }}
            onPerfil={() => navigate('/profile')}
            onConfig={() => navigate('/settings')}
            onSalir={() => {
              setActiveProject(null);
              setMode('login');
              navigate('/');
            }}
          />
          </React.Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // No mostrar loader intermedio
  if (isProjectPath && !activeProject) return null;

  if (isProjectPath || (mode === 'project' && activeProject)) {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={null}>
        <Routes>
          <Route
            index
            element={
              <ProjectDetail
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route
            path='planificacion'
            element={
              <ProjectDetail
                initialTab='planificacion'
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route
            path='equipo'
            element={
              <ProjectDetail
                initialTab='equipo'
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route
            path='necesidades'
            element={
              <ErrorBoundary>
                <ProjectDetail
                  initialTab='necesidades'
                  project={activeProject as UIProject}
                  user={{ name: userName || 'Usuario' } as any}
                  onBack={() => {
                    setMode('projects');
                    navigate('/projects');
                  }}
                  onUpdateProject={(updatedProject: UIProject) => {
                    setProjects((prev: UIProject[]) => {
                      if (!Array.isArray(prev)) return [updatedProject];
                      return prev.map((p: UIProject) => 
                        p.id === updatedProject.id ? updatedProject : p
                      );
                    });
                    setActiveProject(updatedProject);
                  }}
                />
              </ErrorBoundary>
            }
          />
          <Route
            path='reportes'
            element={
              <ProjectDetail
                initialTab='reportes'
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route
            path='nomina'
            element={
              <ProjectDetail
                initialTab='nomina'
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route
            path='condiciones'
            element={
              <ProjectDetail
                initialTab='condiciones'
                project={activeProject as UIProject}
                user={{ name: userName || 'Usuario' } as any}
                onBack={() => {
                  setMode('projects');
                  navigate('/projects');
                }}
                onUpdateProject={(updatedProject: UIProject) => {
                  setProjects((prev: UIProject[]) => {
                    if (!Array.isArray(prev)) return [updatedProject];
                    return prev.map((p: UIProject) => 
                      p.id === updatedProject.id ? updatedProject : p
                    );
                  });
                  setActiveProject(updatedProject);
                }}
              />
            }
          />
          <Route path='*' element={<Navigate to='.' replace />} />
        </Routes>
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  // Páginas fuera de proyecto
  if (location.pathname === '/profile') {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={null}>
          <ProfilePage />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  if (location.pathname === '/settings') {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={null}>
          <SettingsPage />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  // Si estamos en /project/:id pero no hay proyecto, redirige a /projects (silencioso)
  if ((isProjectPath || mode === 'project') && !activeProject) {
    return <Navigate to='/projects' replace />;
  }

  return null; // deja que App.jsx renderice login/register
}
