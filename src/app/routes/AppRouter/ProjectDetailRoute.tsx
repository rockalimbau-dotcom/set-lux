import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../../../shared/components';
import type { Project as UIProject } from '../../../features/projects/pages/ProjectsScreen.tsx';
import type { ProjectHandlers } from './AppRouterTypes';

const ProjectDetail = React.lazy(() => import('../../../features/projects/pages/ProjectDetail.tsx'));

interface ProjectDetailRouteProps {
  activeProject: UIProject;
  userName: string | null;
  initialTab?: string;
  handlers: ProjectHandlers;
}

/**
 * Create a ProjectDetail route element
 */
export function createProjectDetailElement({
  activeProject,
  userName,
  initialTab,
  handlers,
}: ProjectDetailRouteProps) {
  return (
    <ProjectDetail
      project={activeProject}
      user={{ name: userName || 'Usuario' } as any}
      initialTab={initialTab}
      onBack={handlers.onBack}
      onUpdateProject={handlers.onUpdateProject}
    />
  );
}

/**
 * Project detail route component
 */
export function ProjectDetailRoute({
  activeProject,
  userName,
  handlers,
}: Omit<ProjectDetailRouteProps, 'initialTab'>) {
  return (
    <>
      <Route
        index
        element={createProjectDetailElement({
          activeProject,
          userName,
          handlers,
        })}
      />
      <Route
        path='planificacion'
        element={createProjectDetailElement({
          activeProject,
          userName,
          initialTab: 'planificacion',
          handlers,
        })}
      />
      <Route
        path='equipo'
        element={createProjectDetailElement({
          activeProject,
          userName,
          initialTab: 'equipo',
          handlers,
        })}
      />
      <Route
        path='necesidades'
        element={
          <ErrorBoundary>
            <React.Suspense fallback={null}>
              {createProjectDetailElement({
                activeProject,
                userName,
                initialTab: 'necesidades',
                handlers,
              })}
            </React.Suspense>
          </ErrorBoundary>
        }
      />
      <Route
        path='reportes'
        element={createProjectDetailElement({
          activeProject,
          userName,
          initialTab: 'reportes',
          handlers,
        })}
      />
      <Route
        path='nomina'
        element={createProjectDetailElement({
          activeProject,
          userName,
          initialTab: 'nomina',
          handlers,
        })}
      />
      <Route
        path='condiciones'
        element={createProjectDetailElement({
          activeProject,
          userName,
          initialTab: 'condiciones',
          handlers,
        })}
      />
      <Route path='*' element={<Navigate to='.' replace />} />
    </>
  );
}

