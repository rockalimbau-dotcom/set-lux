import { useNavigate } from 'react-router-dom';
import type { Project as UIProject } from '../../../features/projects/types';
import type { AppRouterProps } from './AppRouterTypes';

/**
 * Generate a unique ID for projects
 */
function makeId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * Hook to create project handlers
 */
export function useProjectHandlers({
  setProjects,
  setActiveProject,
  setMode,
}: Pick<AppRouterProps, 'setProjects' | 'setActiveProject' | 'setMode'>) {
  const navigate = useNavigate();

  const onCreateProject = (p: UIProject) => {
    const id = p?.id || makeId();
    const proj: UIProject = { ...p, id };
    setProjects((prev: UIProject[]) => [proj, ...(prev || [])]);
  };

  const onOpenProject = (p: UIProject) => {
    const id = p?.id || makeId();
    const proj: UIProject = { ...p, id };
    setActiveProject(proj);
    // If id was missing, update the list in memory
    if (!p?.id) {
      setProjects((prev: UIProject[]) => {
        const rest = Array.isArray(prev) ? prev.filter(x => x !== p) : [];
        return [proj, ...rest];
      });
    }
    setMode('project');
    const pid = proj.id;
    navigate(`/project/${pid}`);
  };

  const onUpdateProject = (updatedProject: UIProject) => {
    setProjects((prev: UIProject[]) => {
      if (!Array.isArray(prev)) return [updatedProject];
      return prev.map((p: UIProject) => 
        p.id === updatedProject.id ? updatedProject : p
      );
    });
    setActiveProject(updatedProject);
  };

  const onDeleteProject = (projectId: string) => {
    setProjects((prev: UIProject[]) => 
      (Array.isArray(prev) ? prev.filter((x: UIProject) => x?.id !== projectId) : prev)
    );
  };

  const onBack = () => {
    setMode('projects');
    navigate('/projects');
  };

  return {
    onCreateProject,
    onOpenProject,
    onUpdateProject,
    onDeleteProject,
    onBack,
  };
}

