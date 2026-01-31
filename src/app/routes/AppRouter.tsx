import React from 'react';
import { useLocation, Routes, Navigate, Route } from 'react-router-dom';
import { useScrollReset } from './AppRouter/useScrollReset';
import { useRouteSync } from './AppRouter/useRouteSync';
import { useProjectHydration } from './AppRouter/useProjectHydration';
import { useProjectHandlers } from './AppRouter/useProjectHandlers';
import { ProjectsRoute } from './AppRouter/ProjectsRoute';
import { createProjectDetailElement } from './AppRouter/ProjectDetailRoute';
import { ProfileRoute } from './AppRouter/ProfileRoute';
import { SettingsRoute } from './AppRouter/SettingsRoute';
import { ErrorBoundary } from '../../shared/components';
import type { AppRouterProps } from './AppRouter/AppRouterTypes';

export default function AppRouter({
  mode,
  setMode,
  userName,
  projects,
  setProjects,
  activeProject,
  setActiveProject,
}: AppRouterProps) {
  const location = useLocation();
  const isProjectsPath = location.pathname === '/projects';
  const isProjectPath = location.pathname.startsWith('/project/');

  // Custom hooks
  useScrollReset();
  useRouteSync(mode, setMode);
  useProjectHydration(mode, activeProject, projects, setActiveProject);

  // Project handlers
  const handlers = useProjectHandlers({
    setProjects,
    setActiveProject,
    setMode,
  });

  // Projects route
  if (isProjectsPath || mode === 'projects') {
    return (
      <ProjectsRoute
        userName={userName}
        projects={projects}
        handlers={handlers}
        setMode={setMode}
      />
    );
  }

  // Don't show intermediate loader - return null to let hydration complete
  // The redirect below will handle if project is truly not found
  if (isProjectPath && !activeProject) return null;

  // Project detail routes
  if (isProjectPath || (mode === 'project' && activeProject)) {
    return (
      <React.Suspense fallback={null}>
        <Routes>
          <Route
            index
            element={createProjectDetailElement({
              activeProject: activeProject as any,
              userName,
              handlers,
            })}
          />
          <Route
            path='equipo'
            element={createProjectDetailElement({
              activeProject: activeProject as any,
              userName,
              initialTab: 'equipo',
              handlers,
            })}
          />
          <Route
            path='planificacion'
            element={<Navigate to='../calendario' replace />}
          />
          <Route
            path='necesidades'
            element={<Navigate to='../calendario' replace />}
          />
          <Route
            path='calendario'
            element={
              <ErrorBoundary>
                <React.Suspense fallback={null}>
                  {createProjectDetailElement({
                    activeProject: activeProject as any,
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
              activeProject: activeProject as any,
              userName,
              initialTab: 'reportes',
              handlers,
            })}
          />
          <Route
            path='nomina'
            element={createProjectDetailElement({
              activeProject: activeProject as any,
              userName,
              initialTab: 'nomina',
              handlers,
            })}
          />
          <Route
            path='condiciones'
            element={createProjectDetailElement({
              activeProject: activeProject as any,
              userName,
              initialTab: 'condiciones',
              handlers,
            })}
          />
          <Route path='*' element={<Navigate to='.' replace />} />
        </Routes>
      </React.Suspense>
    );
  }

  // Profile route
  if (location.pathname === '/profile') {
    return <ProfileRoute />;
  }

  // Settings route
  if (location.pathname === '/settings') {
    return <SettingsRoute />;
  }

  // If we're on /project/:id but no project, redirect to /projects (silently)
  if ((isProjectPath || mode === 'project') && !activeProject) {
    return <Navigate to='/projects' replace />;
  }

  return null; // Let App.jsx render login/register
}
