import { useEffect } from 'react';
import type { Project as UIProject } from '@features/projects/types';
import { normalizeProjectWithRoleCatalog } from '@shared/utils/projectRoles';

export function shouldNormalizeProjects(projects: UIProject[]): boolean {
  return projects.some(p => !p.country || !p.region || !p.roleCatalog?.roles?.length);
}

/**
 * Hook para normalizar proyectos asegurando que tengan country y region
 */
export function useProjectsNormalization(
  projects: UIProject[],
  setProjects: React.Dispatch<React.SetStateAction<UIProject[]>>
) {
  useEffect(() => {
    if (projects.length === 0) return;
    const needsUpdate = shouldNormalizeProjects(projects);
    if (needsUpdate) {
      const normalized = projects.map(p =>
        normalizeProjectWithRoleCatalog({
          ...p,
          country: p.country || 'ES',
          region: p.region || 'CT',
        })
      );
      setProjects(normalized);
    }
  }, [projects, setProjects]);
}
