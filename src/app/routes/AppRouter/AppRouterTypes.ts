import type { Project as UIProject } from '../../../features/projects/pages/ProjectsScreen.tsx';

export interface AppRouterProps {
  mode: string;
  setMode: (mode: string) => void;
  userName: string | null;
  setUserName: (userName: string | null) => void;
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
