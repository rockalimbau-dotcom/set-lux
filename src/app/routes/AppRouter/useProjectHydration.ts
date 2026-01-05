import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { storage } from '../../../shared/services/localStorage.service';
import type { Project as UIProject } from '../../../features/projects/pages/ProjectsScreen.tsx';

/**
 * Hook to hydrate project from URL params if not already loaded
 */
export function useProjectHydration(
  mode: string,
  activeProject: UIProject | null,
  projects: UIProject[],
  setActiveProject: (project: UIProject | null) => void
) {
  const params = useParams();

  useEffect(() => {
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
}

