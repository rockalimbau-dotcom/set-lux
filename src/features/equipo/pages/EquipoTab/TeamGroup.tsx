import { useState } from 'react';
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
      { id: safeId(), role: allowedRoles[0]?.code || 'E', name: '', seq },
    ]);
  };
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
        className='rounded-2xl border border-neutral-border bg-neutral-panel/90'
        role='region'
        aria-labelledby={headingId}
      >
        <div className='flex items-center justify-between px-5 py-4 gap-3'>
          <h4 id={headingId} className='text-brand font-semibold'>
            {title}
          </h4>
          <div className='flex items-center gap-2'>
            {removable && (
              <button
                onClick={() => canEdit && setShowConfirmRemove(true)}
                disabled={!canEdit}
                className={`px-3 py-2 rounded-lg border text-xs border-neutral-border ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            className={`px-3 py-2 rounded-lg border text-xs border-neutral-border hover:border-accent ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('team.addMemberTo', { title })}
            title={!canEdit ? t('conditions.projectClosed') : t('team.addMemberTo', { title })}
            type='button'
          >
            {t('team.addMember')}
          </button>
        </div>
      </div>

      <div className='px-5 pb-5'>
        {rows.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
            <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
              {t('team.noTeam')}
            </h2>
            <p className='text-xl max-w-2xl' style={{color: 'var(--text)', opacity: 0.8}}>
              {t('team.noTeamMessage')}
            </p>
          </div>
        ) : (
          <div className='grid gap-2'>
            {rows.map((row: AnyRecord) => (
              <TeamRow
                key={row.id}
                row={row}
                onChange={updateRow}
                onRemove={removeRow}
                canEdit={canEdit}
                allowedRoles={shownRoles}
                groupKey={groupKey}
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

