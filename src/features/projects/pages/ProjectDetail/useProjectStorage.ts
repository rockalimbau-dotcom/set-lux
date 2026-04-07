import { useMemo } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';
import { Project, ProjectTeam } from './ProjectDetailTypes';
import { isEmptyTeam } from './ProjectDetailUtils';
import { useProjectSync } from './useProjectSync';
import { normalizeProjectWithRoleCatalog } from '@shared/utils/projectRoles';

export function shouldSyncProjectMetadata(project: Project | null | undefined, proj: Project | null | undefined): boolean {
  if (!project || !proj) return false;
  return (
    JSON.stringify(project?.conditions || null) !== JSON.stringify(proj?.conditions || null) ||
    project?.estado !== proj?.estado ||
    project?.nombre !== proj?.nombre ||
    project?.dop !== proj?.dop ||
    project?.almacen !== proj?.almacen ||
    project?.productora !== proj?.productora ||
    project?.gaffer !== proj?.gaffer ||
    project?.bestBoy !== proj?.bestBoy ||
    project?.jefeProduccion !== proj?.jefeProduccion ||
    project?.transportes !== proj?.transportes ||
    project?.localizaciones !== proj?.localizaciones ||
    project?.coordinadoraProduccion !== proj?.coordinadoraProduccion ||
    project?.country !== proj?.country ||
    project?.region !== proj?.region ||
    JSON.stringify(project?.roleCatalog || null) !== JSON.stringify(proj?.roleCatalog || null)
  );
}

interface UseProjectStorageProps {
  project: Project | null;
}

interface UseProjectStorageReturn {
  proj: Project;
  setProj: React.Dispatch<React.SetStateAction<Project>>;
  condTipo: 'semanal' | 'mensual' | 'diario';
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
    ...normalizeProjectWithRoleCatalog((project || {}) as Project),
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

  // Sincronizar cambios importantes del proyecto desde el prop (cuando se edita desde fuera)
  // Esto asegura que cambios como el tipo de condiciones se reflejen en localStorage
  useEffect(() => {
    if (!loaded || !project) return;
    const normalizedIncoming = normalizeProjectWithRoleCatalog(project);

    // Si hay cambios importantes, actualizar el proyecto en localStorage
    if (shouldSyncProjectMetadata(normalizedIncoming, proj)) {
      setProj(prev => ({
        ...prev,
        nombre: normalizedIncoming.nombre,
        dop: normalizedIncoming.dop,
        almacen: normalizedIncoming.almacen,
        productora: normalizedIncoming.productora,
        gaffer: normalizedIncoming.gaffer,
        bestBoy: normalizedIncoming.bestBoy,
        jefeProduccion: normalizedIncoming.jefeProduccion,
        transportes: normalizedIncoming.transportes,
        localizaciones: normalizedIncoming.localizaciones,
        coordinadoraProduccion: normalizedIncoming.coordinadoraProduccion,
        estado: normalizedIncoming.estado,
        country: normalizedIncoming.country,
        region: normalizedIncoming.region,
        roleCatalog: normalizedIncoming.roleCatalog,
        conditions: {
          ...(prev?.conditions || {}),
          ...(normalizedIncoming?.conditions || {}),
          tipo: normalizedIncoming?.conditions?.tipo || prev?.conditions?.tipo || 'semanal',
        },
      }));
    }
  }, [
    project,
    loaded,
    JSON.stringify(proj?.conditions || null),
    proj?.estado,
    proj?.nombre,
    proj?.dop,
    proj?.almacen,
    proj?.productora,
    proj?.gaffer,
    proj?.bestBoy,
    proj?.jefeProduccion,
    proj?.transportes,
    proj?.localizaciones,
    proj?.coordinadoraProduccion,
    proj?.country,
    proj?.region,
    JSON.stringify(proj?.roleCatalog || null),
    setProj
  ]);

  // Sincronizar cambios de equipo hacia el localStorage separado
  useEffect(() => {
    if (!loaded) return;
    if (proj?.team && !isEmptyTeam(proj.team)) {
      setTeam(proj.team);
    }
  }, [proj?.team, loaded, setTeam]);

  // Modo de condiciones/nómina (mensual | semanal | diario)
  const condTipo = useMemo(
    () => (proj?.conditions?.tipo || 'semanal').toLowerCase() as 'semanal' | 'mensual' | 'diario',
    [proj?.conditions?.tipo]
  );

  // Estado (activo/cerrado) — case-insensitive
  const isActive = useMemo(() => {
    const val = (proj?.estado ?? '').toString().trim().toLowerCase();
    return val === 'activo';
  }, [proj?.estado]);

  return { proj, setProj, condTipo, isActive };
}
