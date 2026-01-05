import CondicionesTab from '@features/condiciones/pages/CondicionesTab.jsx';
import EquipoTab from '@features/equipo/pages/EquipoTab.jsx';
import NecesidadesTab from '@features/necesidades/pages/NecesidadesTab.jsx';
import NominaTab from '@features/nomina/pages/NominaTab.jsx';
import PlanificacionTab from '@features/planificacion/pages/PlanificacionTab.jsx';
import ReportesTab from '@features/reportes/pages/ReportesTab.jsx';
import { Project, ProjectTab, ProjectTeam, TeamMember, ProjectMode } from './ProjectDetailTypes';

interface ProjectDetailContentProps {
  activeTab: ProjectTab;
  project: Project;
  user: { nombreCompleto: string; roleCode: string };
  teamList: TeamMember[];
  condTipo: ProjectMode;
  isActive: boolean;
  onTeamChange: (team: ProjectTeam) => void;
  onConditionsChange: (patch: any) => void;
}

export function ProjectDetailContent({
  activeTab,
  project,
  user,
  teamList,
  condTipo,
  isActive,
  onTeamChange,
  onConditionsChange,
}: ProjectDetailContentProps) {
  return (
    <div
      className='phase-content -mt-1 rounded-2xl border border-neutral-border bg-neutral-panel/90 p-5'
      data-readonly={!isActive ? 'true' : 'false'}
      style={{
        borderColor: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? 'rgba(229,231,235,0.6)' : 'var(--border)'
      }}
    >
      {activeTab === 'planificacion' && (
        <PlanificacionTab
          project={project}
          conditions={project?.conditions}
          baseTeam={project?.team?.base || []}
          prelightTeam={project?.team?.prelight || []}
          pickupTeam={project?.team?.pickup || []}
          reinforcements={project?.team?.reinforcements || []}
          teamList={teamList}
          readOnly={!isActive}
        />
      )}

      {activeTab === 'equipo' && (
        <EquipoTab
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

