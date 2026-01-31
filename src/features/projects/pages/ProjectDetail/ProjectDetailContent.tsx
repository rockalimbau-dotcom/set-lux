import CondicionesTab from '@features/condiciones/pages/CondicionesTab.jsx';
import EquipoTab from '@features/equipo/pages/EquipoTab.jsx';
import NecesidadesTab from '@features/necesidades/pages/NecesidadesTab.jsx';
import NominaTab from '@features/nomina/pages/NominaTab.jsx';
import ReportesTab from '@features/reportes/pages/ReportesTab.jsx';
import { Project, ProjectTab, ProjectTeam, ProjectMode } from './ProjectDetailTypes';

interface ProjectDetailContentProps {
  activeTab: ProjectTab;
  project: Project;
  user: { nombreCompleto: string; roleCode: string };
  condTipo: ProjectMode;
  isActive: boolean;
  onTeamChange: (team: ProjectTeam) => void;
  onConditionsChange: (patch: any) => void;
}

export function ProjectDetailContent({
  activeTab,
  project,
  user,
  condTipo,
  isActive,
  onTeamChange,
  onConditionsChange,
}: ProjectDetailContentProps) {
  return (
    <div
      className='phase-content -mt-1 rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90 p-3 sm:p-4 md:p-5'
      data-readonly={!isActive ? 'true' : 'false'}
      style={{
        borderColor: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      {activeTab === 'equipo' && (
        <EquipoTab
          project={project}
          currentUser={{
            name: user?.nombreCompleto || '',
            role: user?.roleCode || '',
          }}
          initialTeam={project?.team}
          onChange={onTeamChange}
          allowEditOverride={isActive}
          readOnly={!isActive}
          storageKey={`team_${project?.id || project?.nombre}`}
          projectMode={condTipo}
        />
      )}

      {activeTab === 'reportes' && <ReportesTab project={project} mode={condTipo} readOnly={!isActive} />}

      {activeTab === 'nomina' && (
        <NominaTab project={project} mode={condTipo} readOnly={!isActive} />
      )}

      {activeTab === 'necesidades' && <NecesidadesTab project={project} readOnly={!isActive} />}

      {activeTab === 'condiciones' && (
        <CondicionesTab
          project={project}
          mode={condTipo}
          onChange={onConditionsChange}
          readOnly={!isActive}
        />
      )}
    </div>
  );
}

