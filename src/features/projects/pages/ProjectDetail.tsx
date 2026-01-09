import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useMemo } from 'react';

import { ProjectDetailProps, ProjectTab } from './ProjectDetail/ProjectDetailTypes';
import { formatMode } from './ProjectDetail/ProjectDetailUtils';
import { StatusConfirmModal } from './ProjectDetail/StatusConfirmModal';
import { NameValidationModal } from './ProjectDetail/NameValidationModal';
import { ProjectDetailHeader } from './ProjectDetail/ProjectDetailHeader';
import { PhaseGrid } from './ProjectDetail/PhaseGrid';
import { ProjectDetailContent } from './ProjectDetail/ProjectDetailContent';
import { useTeamList } from './ProjectDetail/useTeamList';
import { useProjectStorage } from './ProjectDetail/useProjectStorage';
import { useProjectNavigation } from './ProjectDetail/useProjectNavigation';
import { useProjectModals } from './ProjectDetail/useProjectModals';
import { useProjectHandlers } from './ProjectDetail/useProjectHandlers';

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
  const navigate = useNavigate();

  // Storage and state management
  const { proj, setProj, condTipo, isActive } = useProjectStorage({ project });

  // Navigation and tab management
  const { activeTab, setActiveTab, pid, isNavigatingRef } = useProjectNavigation({
    project,
    initialTab,
  });

  // Modal state management
  const {
    showStatusModal,
    setShowStatusModal,
    showNameValidationModal,
    setShowNameValidationModal,
  } = useProjectModals();

  // Event handlers
  const {
    handleTabChange,
    handleNavigateAway,
    handleNavigateToProject,
    handleTeamChange,
    handleConditionsChange,
    handleStatusConfirm,
  } = useProjectHandlers({
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
  });

  // Override handleStatusClick to set modal
  const handleStatusClick = () => {
    setShowStatusModal({ isClosing: isActive });
  };

  // UI state
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
      if (condModeLabel === 'diario') return t('conditions.advertising');
      return `Condiciones ${condModeLabel}`;
    }
    if (activeTab === 'nomina') return t('navigation.payroll');
    if (activeTab === 'planificacion') return t('navigation.planning');
    if (activeTab === 'necesidades') return t('needs.title');
    if (activeTab === 'equipo') return t('navigation.team');
    if (activeTab === 'reportes') return t('navigation.reports');
    return activeTab;
  }, [activeTab, condModeLabel, t]);

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

      <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6 py-1.5 sm:py-2 md:py-3 lg:py-4 pb-4 sm:pb-5 md:pb-6'>
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
          onConfirm={handleStatusConfirm}
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
