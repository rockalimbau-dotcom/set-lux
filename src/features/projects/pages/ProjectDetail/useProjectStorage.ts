import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';
import { Project, ProjectTeam } from './ProjectDetailTypes';
import { isEmptyTeam } from './ProjectDetailUtils';
import { useProjectSync } from './useProjectSync';

interface UseProjectStorageProps {
  project: Project | null;
}

interface UseProjectStorageReturn {
  proj: Project;
  setProj: React.Dispatch<React.SetStateAction<Project>>;
  condTipo: 'semanal' | 'mensual' | 'publicidad';
  isActive: boolean;
}

/**
 * Hook to manage project storage and state
 */
export function useProjectStorage({ project }: UseProjectStorageProps): UseProjectStorageReturn {
  // Claves de almacenamiento por proyecto
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `project_${base}`;
  }, [project?.id, project?.nombre]);

  const teamKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `team_${base}`;
  }, [project?.id, project?.nombre]);

  // Estado inicial del proyecto
  const initialProject: Project = useMemo(() => ({
    ...project,
    team: project?.team || {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    },
  }), [project]);

  // Persistencia del proyecto principal
  const [proj, setProj] = useLocalStorage<Project>(storageKey, initialProject);

  // Persistencia del equipo (separada para compatibilidad)
  const [, setTeam] = useLocalStorage<ProjectTeam>(teamKey, initialProject.team || {
    base: [],
    reinforcements: [],
    prelight: [],
    pickup: [],
    enabledGroups: { prelight: false, pickup: false },
  });

  // Hook de sincronización
  const { loaded } = useProjectSync(proj);

  // Sincronizar cambios de equipo hacia el localStorage separado
  useEffect(() => {
    if (!loaded) return;
    if (proj?.team && !isEmptyTeam(proj.team)) {
      setTeam(proj.team);
    }
  }, [proj?.team, loaded, setTeam]);

  // Modo de condiciones/nómina (mensual | semanal | publicidad)
  const condTipo = useMemo(
    () => (proj?.conditions?.tipo || 'semanal').toLowerCase() as 'semanal' | 'mensual' | 'publicidad',
    [proj?.conditions?.tipo]
  );

  // Estado (activo/cerrado) — case-insensitive
  const isActive = useMemo(() => {
    const val = (proj?.estado ?? '').toString().trim().toLowerCase();
    return val === 'activo';
  }, [proj?.estado]);

  return { proj, setProj, condTipo, isActive };
}

