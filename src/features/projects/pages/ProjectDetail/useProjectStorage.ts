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

  // Sincronizar cambios importantes del proyecto desde el prop (cuando se edita desde fuera)
  // Esto asegura que cambios como el tipo de condiciones se reflejen en localStorage
  useEffect(() => {
    if (!loaded || !project) return;
    
    // Comparar campos importantes que pueden cambiar desde EditProjectModal
    const tipoChanged = project?.conditions?.tipo !== proj?.conditions?.tipo;
    const estadoChanged = project?.estado !== proj?.estado;
    const nombreChanged = project?.nombre !== proj?.nombre;
    const dopChanged = project?.dop !== proj?.dop;
    const almacenChanged = project?.almacen !== proj?.almacen;
    const productoraChanged = project?.productora !== proj?.productora;
    const countryChanged = project?.country !== proj?.country;
    const regionChanged = project?.region !== proj?.region;
    
    // Si hay cambios importantes, actualizar el proyecto en localStorage
    if (tipoChanged || estadoChanged || nombreChanged || dopChanged || almacenChanged || productoraChanged || countryChanged || regionChanged) {
      setProj(prev => ({
        ...prev,
        nombre: project.nombre,
        dop: project.dop,
        almacen: project.almacen,
        productora: project.productora,
        estado: project.estado,
        country: project.country,
        region: project.region,
        conditions: {
          ...(prev?.conditions || {}),
          ...(project?.conditions || {}),
          tipo: project?.conditions?.tipo || prev?.conditions?.tipo || 'semanal',
        },
      }));
    }
  }, [project, loaded, proj?.conditions?.tipo, proj?.estado, proj?.nombre, proj?.dop, proj?.almacen, proj?.productora, proj?.country, proj?.region, setProj]);

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

