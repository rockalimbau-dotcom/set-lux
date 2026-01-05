import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { storage } from '@shared/services/localStorage.service';

import {
  Project,
  ProjectDetailProps,
  ProjectTab,
  ProjectTeam,
  ProjectStatus,
  ProjectMode,
} from './ProjectDetail/ProjectDetailTypes';
import { isEmptyTeam, validateTeamNames, formatMode } from './ProjectDetail/ProjectDetailUtils';
import { StatusConfirmModal } from './ProjectDetail/StatusConfirmModal';
import { NameValidationModal } from './ProjectDetail/NameValidationModal';
import { ProjectDetailHeader } from './ProjectDetail/ProjectDetailHeader';
import { PhaseGrid } from './ProjectDetail/PhaseGrid';
import { ProjectDetailContent } from './ProjectDetail/ProjectDetailContent';
import { useProjectSync } from './ProjectDetail/useProjectSync';
import { useTeamList } from './ProjectDetail/useTeamList';

/**
 * ProjectDetail
 * - Vista de detalle de proyecto
 * - Solo muestra tarjetas de fases (2 por fila).
 * - El contenido de una fase se abre al hacer clic en su tarjeta.
 * - PERSISTE por proyecto en localStorage (sin tocar la UI).
 */
export default function ProjectDetail({
  project,
  user,
  onBack,
  onUpdateProject,
  initialTab = null,
}: ProjectDetailProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const pid = params.id || project?.id || project?.nombre || 'tmp';

  // Prevenir scroll automático al cambiar de ruta para evitar movimiento del logo
  React.useEffect(() => {
    // Forzar scroll a la parte superior inmediatamente sin animación
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);
  
  // --- modo de condiciones/nómina (mensual | semanal | publicidad)
  const condTipo = useMemo(
    () => (project?.conditions?.tipo || 'semanal').toLowerCase() as ProjectMode,
    [project?.conditions?.tipo]
  );
  
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
  const initialProject: Project = {
    ...project,
    team: project?.team || {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    },
  };

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

  const [activeTab, setActiveTab] = useState<ProjectTab | null>(initialTab as ProjectTab ?? null);
  const [showStatusModal, setShowStatusModal] = useState<{ isClosing: boolean } | null>(null);
  const [showNameValidationModal, setShowNameValidationModal] = useState<{ targetTab: ProjectTab | null; roleWithoutName: { role: string; group: string } } | null>(null);
  const isNavigatingRef = React.useRef(false);

  // Ruta -> pestaña (al entrar directamente por URL o al refrescar)
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    
    try {
      const path = String(location.pathname || '');
      const m = path.match(/\/project\/[^/]+\/?([^/?#]+)?/);
      const seg = (m && m[1]) || '';
      const valid = new Set<ProjectTab>([
        'equipo',
        'planificacion',
        'reportes',
        'nomina',
        'necesidades',
        'condiciones',
      ]);
      if (seg && valid.has(seg as ProjectTab)) {
        if (activeTab !== seg) setActiveTab(seg as ProjectTab);
      } else if (!seg && activeTab !== null) {
        setActiveTab(null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Pestaña -> ruta (sin cambiar UI)
  useEffect(() => {
    const base = `/project/${pid}`;
    const want = activeTab ? `${base}/${activeTab}` : base;
    if (location.pathname !== want) {
      isNavigatingRef.current = true;
      navigate(want, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pid]);

  // Estado (activo/cerrado) — case-insensitive
  const isActive = useMemo(() => {
    const val = (proj?.estado ?? '').toString().trim().toLowerCase();
    return val === 'activo';
  }, [proj?.estado]);

  const estadoText = isActive ? t('common.active') : t('common.closed');
  const themeGlobal = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  const estadoBg = isActive ? (themeGlobal === 'light' ? '#0468BF' : '#F27405') : '#64748b';

  // Lista de equipo simplificada para Planificación
  const teamList = useTeamList(proj);

  // Lee el modo (nuevo: conditions.tipo). Mantén compat con "mode" si existiera.
  const condModeRaw =
    proj?.conditions?.tipo || proj?.conditionsMode || proj?.conditions?.mode;
  const condModeLabel = formatMode(condModeRaw);

  // Texto de fase activo para el título
  const activePhaseLabel = useMemo(() => {
    if (!activeTab) return '';
    if (activeTab === 'condiciones') {
      if (condModeLabel === 'semanales') return t('conditions.weekly');
      if (condModeLabel === 'mensuales') return t('conditions.monthly');
      if (condModeLabel === 'publicidad') return t('conditions.advertising');
      return `Condiciones ${condModeLabel}`;
    }
    if (activeTab === 'nomina') return t('navigation.payroll');
    if (activeTab === 'planificacion') return t('navigation.planning');
    if (activeTab === 'necesidades') return t('needs.title');
    if (activeTab === 'equipo') return t('navigation.team');
    if (activeTab === 'reportes') return t('navigation.reports');
    return activeTab;
  }, [activeTab, condModeLabel, t]);

  // Wrapper para setActiveTab que valida nombres antes de cambiar
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

  // Wrapper para navegar fuera del proyecto que valida nombres
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

  const handleStatusClick = () => {
    setShowStatusModal({ isClosing: isActive });
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

  return (
    <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12' style={{paddingTop: 0}}>
      <ProjectDetailHeader
        project={proj}
        activeTab={activeTab}
        activePhaseLabel={activePhaseLabel}
        isActive={isActive}
        estadoText={estadoText}
        estadoBg={estadoBg}
        onNavigateAway={handleNavigateAway}
        onNavigateToProject={handleNavigateToProject}
        onStatusClick={handleStatusClick}
        t={t}
      />

      <div className='px-6 pb-6'>
        <div className='max-w-6xl mx-auto'>
          {/* Parrilla de fases (tarjetas) */}
          {activeTab === null && (
            <PhaseGrid
              condModeLabel={condModeLabel}
              condTipo={condTipo}
              onTabChange={handleTabChange}
            />
          )}

          {/* Contenido de la fase seleccionada */}
          {activeTab !== null && (
            <ProjectDetailContent
              activeTab={activeTab}
              project={proj}
              user={user}
              teamList={teamList}
              condTipo={condTipo}
              isActive={isActive}
              onTeamChange={handleTeamChange}
              onConditionsChange={handleConditionsChange}
            />
          )}
        </div>
      </div>

      {/* Modal confirmar cambio de estado */}
      {showStatusModal && typeof document !== 'undefined' && createPortal(
        <StatusConfirmModal
          projectName={proj?.nombre || 'este proyecto'}
          isClosing={showStatusModal.isClosing}
          onClose={() => setShowStatusModal(null)}
          onConfirm={() => {
            const nextEstado: ProjectStatus = showStatusModal.isClosing ? 'Cerrado' : 'Activo';
            setProj(p => {
              const updated = { ...p, estado: nextEstado };
              try {
                onUpdateProject?.(updated);
              } catch {}
              return updated;
            });
          }}
        />,
        document.body
      )}

      {/* Modal validación de nombres de roles */}
      {showNameValidationModal && typeof document !== 'undefined' && createPortal(
        <NameValidationModal
          role={showNameValidationModal.roleWithoutName.role}
          group={showNameValidationModal.roleWithoutName.group}
          onClose={() => setShowNameValidationModal(null)}
        />,
        document.body
      )}
    </div>
  );
}
