import { useEffect } from 'react';
import type { Project as UIProject } from '@features/projects/pages/ProjectsScreen.tsx';

/**
 * Hook para normalizar proyectos asegurando que tengan country y region
 */
export function useProjectsNormalization(
  projects: UIProject[],
  setProjects: React.Dispatch<React.SetStateAction<UIProject[]>>
) {
  useEffect(() => {
    if (projects.length === 0) return;
    const needsUpdate = projects.some(p => !p.country || !p.region);
    if (needsUpdate) {
      const normalized = projects.map(p => ({
        ...p,
        country: p.country || 'ES',
        region: p.region || 'CT',
      }));
      setProjects(normalized);
    }
  }, []); // Only run once on mount
}

