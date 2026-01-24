import type { Project as UIProject } from '../../../features/projects/types';

export interface AppRouterProps {
  mode: string;
  setMode: (mode: string) => void;
  userName: string | null;
  projects: UIProject[];
  setProjects: (projects: UIProject[] | ((prev: UIProject[]) => UIProject[])) => void;
  activeProject: UIProject | null;
  setActiveProject: (project: UIProject | null) => void;
}

export interface ProjectHandlers {
  onCreateProject: (p: UIProject) => void;
  onOpenProject: (p: UIProject) => void;
  onUpdateProject: (updatedProject: UIProject) => void;
  onDeleteProject: (projectId: string) => void;
  onBack: () => void;
}
