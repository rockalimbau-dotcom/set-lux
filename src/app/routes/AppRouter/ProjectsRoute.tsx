import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../../shared/components';
import { storage } from '../../../shared/services/localStorage.service';
import type { Project as UIProject } from '../../../features/projects/types';
import type { ProjectHandlers } from './AppRouterTypes';

const ProjectsScreen = React.lazy(() => import('../../../features/projects/pages/ProjectsScreen.tsx'));

interface ProjectsRouteProps {
  userName: string | null;
  projects: UIProject[];
  handlers: ProjectHandlers;
  setMode: (mode: string) => void;
}

/**
 * Projects screen route component
 */
export function ProjectsRoute({
  userName,
  projects,
  handlers,
  setMode,
}: ProjectsRouteProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // Limpiar datos de sesión
      storage.remove('currentUser');
      // Resetear el modo a login
      setMode('login');
      // Opcional: limpiar el nombre de usuario
      // setUserName(null);
      // Navegar a la página de login
      navigate('/', { replace: true });
    } catch (error) {
      // Si hay error, aún así hacer logout
      setMode('login');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12' style={{paddingTop: 0}}>
      <ErrorBoundary>
        <React.Suspense fallback={null}>
          <ProjectsScreen
            userName={userName || 'Usuario'}
            projects={projects}
            onCreateProject={handlers.onCreateProject}
            onOpen={handlers.onOpenProject}
            onUpdateProject={handlers.onUpdateProject}
            onDeleteProject={handlers.onDeleteProject}
            onPerfil={() => navigate('/profile')}
            onConfig={() => navigate('/settings')}
            onSalir={handleLogout}
          />
        </React.Suspense>
      </ErrorBoundary>
    </div>
  );
}

