import { Project, ProjectTab, ProjectTeam, ProjectStatus, ProjectMode } from './ProjectDetailTypes';
import { validateTeamNames } from './ProjectDetailUtils';

interface UseProjectHandlersProps {
  proj: Project;
  isActive: boolean;
  activeTab: ProjectTab | null;
  setProj: React.Dispatch<React.SetStateAction<Project>>;
  setActiveTab: (tab: ProjectTab | null) => void;
  setShowNameValidationModal: (modal: { targetTab: ProjectTab | null; roleWithoutName: { role: string; group: string } } | null) => void;
  onUpdateProject?: (project: Project) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  pid: string;
  isNavigatingRef: React.MutableRefObject<boolean>;
}

interface UseProjectHandlersReturn {
  handleTabChange: (newTab: ProjectTab | null) => void;
  handleNavigateAway: () => void;
  handleNavigateToProject: () => void;
  handleTeamChange: (model: ProjectTeam) => void;
  handleConditionsChange: (patch: any) => void;
  handleStatusConfirm: () => void;
}

/**
 * Hook to manage project event handlers
 */
export function useProjectHandlers({
  proj,
  isActive,
  activeTab,
  setProj,
  setActiveTab,
  setShowNameValidationModal,
  onUpdateProject,
  navigate,
  pid,
  isNavigatingRef,
}: UseProjectHandlersProps): UseProjectHandlersReturn {
  const handleTabChange = (newTab: ProjectTab | null) => {
    // Si estamos en la pestaña de equipo o saliendo de ella, validar nombres
    if (activeTab === 'equipo' || newTab === 'equipo') {
      const invalidRole = validateTeamNames(proj?.team);
      if (invalidRole) {
        setShowNameValidationModal({ targetTab: newTab, roleWithoutName: invalidRole });
        return;
      }
    }
    setActiveTab(newTab);
  };

  const handleNavigateAway = () => {
    // Si estamos en la pestaña de equipo, validar nombres antes de salir
    if (activeTab === 'equipo') {
      const invalidRole = validateTeamNames(proj?.team);
      if (invalidRole) {
        setShowNameValidationModal({ targetTab: null, roleWithoutName: invalidRole });
        return;
      }
    }
    isNavigatingRef.current = true;
    navigate('/projects');
  };

  const handleNavigateToProject = () => {
    // Validar nombres antes de volver al menú del proyecto
    if (activeTab === 'equipo') {
      const invalidRole = validateTeamNames(proj?.team);
      if (invalidRole) {
        setShowNameValidationModal({ targetTab: null, roleWithoutName: invalidRole });
        return;
      }
    }
    isNavigatingRef.current = true;
    setActiveTab(null);
    navigate(`/project/${proj?.id}`, { replace: false });
  };


  const handleTeamChange = (model: ProjectTeam) => {
    // Si el proyecto está cerrado, no permitir cambios
    if (!isActive) return;
    // Actualiza proyecto + persiste (en ambas claves)
    setProj(p => {
      const next = { ...p, team: model };
      return next;
    });
  };

  const handleConditionsChange = (patch: any) => {
    // Si el proyecto está cerrado, no permitir cambios
    if (!isActive) return;
    // Solo actualizar si hay cambios reales
    if (!patch) return;
    
    setProj(p => {
      // Si desde Condiciones cambian el tipo, respétalo; si no, conserva el actual
      const prevTipo = p?.conditions?.tipo || 'semanal';
      const nextTipo = (patch?.tipo || prevTipo).toLowerCase() as ProjectMode;
      const next = {
        ...p,
        conditions: {
          ...(p.conditions || {}),
          ...patch,
          tipo: nextTipo,
        },
      };
      return next;
    });
  };

  const handleStatusConfirm = () => {
    const nextEstado: ProjectStatus = isActive ? 'Cerrado' : 'Activo';
    setProj(p => {
      const updated = { ...p, estado: nextEstado };
      try {
        onUpdateProject?.(updated);
      } catch {}
      return updated;
    });
  };

  return {
    handleTabChange,
    handleNavigateAway,
    handleNavigateToProject,
    handleTeamChange,
    handleConditionsChange,
    handleStatusConfirm,
  };
}

