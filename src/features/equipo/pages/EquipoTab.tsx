import React from 'react';
import { ROLES } from '@shared/constants/roles';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { EquipoTabProps } from './EquipoTab/EquipoTabTypes';
import { sortTeam } from './EquipoTab/EquipoTabUtils';
import { useEquipoData } from './EquipoTab/useEquipoData';
import { useEquipoActions } from './EquipoTab/useEquipoActions';
import { TeamGroup } from './EquipoTab/TeamGroup';
import { btnExport } from '@shared/utils/tailwindClasses';
import { exportEquipoToPDF } from '../utils/exportPDF/exportToPDF';

function EquipoTab({
  currentUser = { name: '', role: '' },
  initialTeam,
  onChange = () => {},
  readOnly: readOnlyProp,
  allowEditOverride = false,
  storageKey = 'setlux_equipo_global_v2',
  projectMode = 'semanal',
  project,
}: EquipoTabProps) {
  const { t } = useTranslation();
  const canEdit = useMemo(() => {
    if (allowEditOverride) return true;
    if (readOnlyProp === true) return false;
    return currentUser?.role === 'G' || currentUser?.role === 'BB';
  }, [currentUser, readOnlyProp, allowEditOverride]);

  // Filtrar roles según el modo del proyecto
  const allowedRoles = useMemo(() => {
    if (projectMode === 'diario') {
      // En diario, excluir Meritorio (M) y Refuerzo (REF)
      return ROLES.filter(r => r.code !== 'M' && r.code !== 'REF');
    }
    return ROLES;
  }, [projectMode]);

  // Determinar si mostrar la sección de refuerzos
  const showReinforcements = useMemo(() => {
    return projectMode !== 'diario';
  }, [projectMode]);

  // Manage equipo data
  const { team, setTeam, groupsEnabled, setGroupsEnabled, setTeamData } = useEquipoData({
    initialTeam,
    storageKey,
    currentUser,
  });

  // Actions
  const { nextSeq, enableGroup, disableGroup } = useEquipoActions({
    team,
    groupsEnabled,
    setTeam,
    setGroupsEnabled,
    setTeamData,
    storageKey,
    onChange,
  });

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      <div className='flex items-center justify-between'>
        <div />
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          {!groupsEnabled.prelight && (
            <button
              onClick={() => canEdit && enableGroup('prelight')}
              disabled={!canEdit}
              className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs border-neutral-border hover:border-accent whitespace-nowrap ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!canEdit ? t('conditions.projectClosed') : t('team.addPrelight')}
              aria-label={t('team.addPrelightButton')}
              type='button'
            >
              {t('team.addPrelightButton')}
            </button>
          )}
          {!groupsEnabled.pickup && (
            <button
              onClick={() => canEdit && enableGroup('pickup')}
              disabled={!canEdit}
              className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs border-neutral-border hover:border-accent whitespace-nowrap ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!canEdit ? t('conditions.projectClosed') : t('team.addPickup')}
              aria-label={t('team.addPickupButton')}
              type='button'
            >
              {t('team.addPickupButton')}
            </button>
          )}
          <button
            onClick={() => exportEquipoToPDF(project, team)}
            disabled={!team}
            className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs border-neutral-border hover:border-accent whitespace-nowrap ${!team ? 'opacity-50 cursor-not-allowed' : ''} ${btnExport}`}
            title="PDF"
            type='button'
          >
            PDF
          </button>
        </div>
      </div>

      <TeamGroup
        title={t('team.baseTeam')}
        rows={team.base.filter((r: AnyRecord) => r.role !== 'REF')}
        setRows={(rows: AnyRecord[]) => {
          // Filtrar REF del equipo base
          const filteredRows = rows.filter((r: AnyRecord) => r.role !== 'REF');
          setTeam(prev => ({ ...prev, base: sortTeam(filteredRows) }));
        }}
        canEdit={canEdit}
        nextSeq={nextSeq}
        allowedRoles={allowedRoles.filter(r => r.code !== 'REF')}
        groupKey='base'
      />
      {showReinforcements && (
        <TeamGroup
          title={t('team.reinforcements')}
          rows={team.reinforcements.filter((r: AnyRecord) => r.role !== 'REF')}
          setRows={(rows: AnyRecord[]) => {
            // Filtrar REF de refuerzos - el rol 'REF' ya no se usa
            const filteredRows = rows.filter((r: AnyRecord) => r.role !== 'REF');
            setTeam(prev => ({ ...prev, reinforcements: sortTeam(filteredRows) }));
          }}
          canEdit={canEdit}
          nextSeq={nextSeq}
          allowedRoles={ROLES.filter(r => r.code !== 'AUX' && r.code !== 'M' && r.code !== 'REF').map(r => ({
            code: `REF${r.code}`,
            label: r.label
          }))}
          groupKey='reinforcements'
        />
      )}
      {groupsEnabled.prelight && (
        <TeamGroup
          title={t('team.prelightTeam')}
          rows={team.prelight.filter((r: AnyRecord) => r.role !== 'REF')}
          setRows={(rows: AnyRecord[]) => {
            // Filtrar REF de prelight - el rol 'REF' ya no se usa
            const filteredRows = rows.filter((r: AnyRecord) => r.role !== 'REF');
            setTeam(prev => ({ ...prev, prelight: sortTeam(filteredRows) }));
          }}
          canEdit={canEdit}
          nextSeq={nextSeq}
          removable
          onRemoveGroup={() => disableGroup('prelight')}
          allowedRoles={allowedRoles.filter(r => r.code !== 'REF') as any}
          groupKey='prelight'
        />
      )}
      {groupsEnabled.pickup && (
        <TeamGroup
          title={t('team.pickupTeam')}
          rows={team.pickup.filter((r: AnyRecord) => r.role !== 'REF')}
          setRows={(rows: AnyRecord[]) => {
            // Filtrar REF de pickup - el rol 'REF' ya no se usa
            const filteredRows = rows.filter((r: AnyRecord) => r.role !== 'REF');
            setTeam(prev => ({ ...prev, pickup: sortTeam(filteredRows) }));
          }}
          canEdit={canEdit}
          nextSeq={nextSeq}
          removable
          onRemoveGroup={() => disableGroup('pickup')}
          allowedRoles={allowedRoles.filter(r => r.code !== 'REF') as any}
          groupKey='pickup'
        />
      )}

      <p className='text-[9px] sm:text-[10px] md:text-xs text-zinc-500'>
        <span className='text-brand font-semibold'>{t('team.tip')}</span>{' '}
        <span dangerouslySetInnerHTML={{ __html: t('team.tipMessage') }} />
      </p>
    </div>
  );
}

export default React.memo(EquipoTab);
