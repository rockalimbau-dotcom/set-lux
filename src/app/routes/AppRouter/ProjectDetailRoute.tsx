import React from 'react';
import type { Project as UIProject } from '../../../features/projects/types';
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
      onUpdateProject={handlers.onUpdateProject as (project: any) => void}
    />
  );
}

