import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { safeId, displayRolesForGroup } from './EquipoTabUtils';
import { TeamRow } from './TeamRow';
import { ConfirmModal } from './ConfirmModal';

interface TeamGroupProps {
  title: string;
  rows: AnyRecord[];
  setRows: (rows: AnyRecord[]) => void;
  canEdit: boolean;
  removable?: boolean;
  onRemoveGroup?: () => void;
  allowedRoles: AnyRecord[];
  nextSeq: () => number;
  groupKey?: string;
}

export function TeamGroup({
  title,
  rows,
  setRows,
  canEdit,
  removable,
  onRemoveGroup,
  allowedRoles,
  nextSeq,
  groupKey = 'base',
}: TeamGroupProps) {
  const { t } = useTranslation();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const addRow = () => {
    if (!canEdit) return;
    const seq = nextSeq();
    setRows([
      ...rows,
      { id: safeId(), role: allowedRoles[0]?.code || 'E', name: '', gender: 'neutral', seq },
    ]);
    if (groupKey === 'base') {
      try {
        window.dispatchEvent(new CustomEvent('tutorial-team-member-added'));
      } catch {}
    }
  };

  useEffect(() => {
    if (groupKey !== 'base') return;
    const handler = () => addRow();
    window.addEventListener('tutorial-team-add-row', handler as EventListener);
    return () => window.removeEventListener('tutorial-team-add-row', handler as EventListener);
  }, [groupKey, addRow]);
  const updateRow = (id: string, patch: AnyRecord) => {
    if (!canEdit) return;
    setRows(rows.map((r: AnyRecord) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => {
    if (!canEdit) return;
    setRows(rows.filter((r: AnyRecord) => r.id !== id));
  };

  const shownRoles = displayRolesForGroup(allowedRoles, groupKey);

  const headingId = `${groupKey}-heading`;
  const sectionId = `${groupKey}-section`;
  return (
    <>
      <section
        id={sectionId}
        className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90'
        role='region'
        aria-labelledby={headingId}
      >
        <div className='flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4 gap-1.5 sm:gap-2 md:gap-3'>
          <h4 id={headingId} className='text-brand font-semibold text-xs sm:text-sm md:text-base'>
            {title}
          </h4>
          <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
            {removable && (
              <button
                onClick={() => canEdit && setShowConfirmRemove(true)}
                disabled={!canEdit}
                className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs border-neutral-border whitespace-nowrap ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={t('team.removeGroup')}
                title={!canEdit ? t('conditions.projectClosed') : t('team.removeGroup')}
                type='button'
              >
                {t('team.removeGroup')}
              </button>
            )}
          <button
            onClick={addRow}
            disabled={!canEdit}
            data-tutorial={groupKey === 'base' ? 'team-add-base' : undefined}
            className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs border-neutral-border hover:border-accent whitespace-nowrap ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('team.addMemberTo', { title })}
            title={!canEdit ? t('conditions.projectClosed') : t('team.addMemberTo', { title })}
            type='button'
          >
            {t('team.addMember')}
          </button>
        </div>
      </div>

      <div className='px-2 pb-2 sm:px-3 sm:pb-3 md:px-4 md:pb-4 lg:px-5 lg:pb-5'>
        {rows.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 px-4 sm:py-12 sm:px-6 md:py-16 md:px-8 text-center'>
            <h2 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4' style={{color: 'var(--text)'}}>
              {t('team.noTeam')}
            </h2>
            <p className='text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
              {t('team.noTeamMessage')}
            </p>
          </div>
        ) : (
          <div className='grid gap-1 sm:gap-1.5 md:gap-2'>
            {rows.map((row: AnyRecord, index: number) => (
              <TeamRow
                key={row.id}
                row={row}
                onChange={updateRow}
                onRemove={removeRow}
                canEdit={canEdit}
                allowedRoles={shownRoles}
                groupKey={groupKey}
                tutorialId={groupKey === 'base' && index === rows.length - 1 ? 'team-row-base' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
    {showConfirmRemove && (
      <ConfirmModal
        title={t('team.confirmDeletion')}
        message={t('team.confirmDeleteGroup', { title })}
        onClose={() => setShowConfirmRemove(false)}
        onConfirm={() => {
          onRemoveGroup?.();
        }}
      />
    )}
    </>
  );
}

