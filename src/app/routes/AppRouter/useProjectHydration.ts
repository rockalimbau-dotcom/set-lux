import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { storage } from '../../../shared/services/localStorage.service';
import type { Project as UIProject } from '../../../features/projects/types';
import { normalizeProjectWithRoleCatalog } from '../../../shared/utils/projectRoles';

export function normalizeHydratedProject(project: UIProject | null | undefined): UIProject | null {
  if (!project) return null;
  return normalizeProjectWithRoleCatalog(project);
}

/**
 * Hook to hydrate project from URL params if not already loaded
 */
export function useProjectHydration(
  _mode: string,
  activeProject: UIProject | null,
  projects: UIProject[],
  setActiveProject: (project: UIProject | null) => void
) {
  const params = useParams();

  useEffect(() => {
    // Don't wait for mode to be 'project' - hydrate based on URL params immediately
    // This prevents blank page when route sync hasn't set mode yet
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
    if (found) setActiveProject(normalizeHydratedProject(found));
  }, [activeProject, params.id, projects, setActiveProject]);
}
