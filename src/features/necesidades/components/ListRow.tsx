import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Chip from './Chip';
import TextAreaAuto from './TextAreaAuto';

interface ConfirmModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, onClose, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const isLight = theme === 'light';

  return (
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 sm:p-6 md:p-6 z-50 overflow-y-auto'>
      <div 
        className='w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-xs xl:max-w-sm 2xl:max-w-md rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 my-auto max-h-[75vh] sm:max-h-[80vh] overflow-y-auto'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
          {title}
        </h3>
        
        <p 
          className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: message
          }}
        />

        <div className='flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3'>
          <button
            onClick={onClose}
            className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            {t('needs.no')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='inline-flex items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border transition text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            {t('needs.yes')}
          </button>
        </div>
      </div>
    </div>
  );
}


// DAYS will be created inside the component to use translations

type ListRowProps = {
  label: string;
  listKey: string;
  notesKey: string;
  weekId: string;
  weekObj: AnyRecord;
  context?: string;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string; // Clave única para identificar esta fila
  isSelected?: boolean; // Si la fila está seleccionada
  toggleRowSelection?: (rowKey: string) => void; // Función para alternar selección
};

export default function ListRow({ label, listKey, notesKey, weekId, weekObj, context, removeFromList, setCell, readOnly = false, rowKey, isSelected, toggleRowSelection }: ListRowProps) {
  const { t } = useTranslation();
  const [memberToRemove, setMemberToRemove] = useState<{
    weekId: string;
    dayIdx: number;
    listKey: string;
    idx: number;
    memberName: string;
  } | null>(null);

  const DAYS = useMemo(() => [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ], [t]);

  return (
    <>
      <tr>
        {/* Checkbox para selección de fila - primera columna */}
        {rowKey && toggleRowSelection && (
          <Td align='middle' className='text-center'>
            <div className='flex justify-center'>
              <input
                type='checkbox'
                checked={isSelected ?? true}
                onChange={() => !readOnly && toggleRowSelection(rowKey)}
                disabled={readOnly}
                title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('needs.deselectForExport') : t('needs.selectForExport'))}
                className={`accent-blue-500 dark:accent-[#f59e0b] ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              />
            </div>
          </Td>
        )}
        {/* Etiqueta de la fila */}
        <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
          {label}
        </Td>
        {DAYS.map((d, i) => {
          const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
          const list = Array.isArray(day[listKey]) ? (day[listKey] as AnyRecord[]) : [];
          return (
            <Td key={d.key} align='middle' className='text-center'>
              <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2 justify-center'>
                {list.length === 0 && (
                  <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>—</span>
                )}
                {list.map((m, idx) => (
                  <Chip
                    key={`${m.role}-${m.name}-${idx}`}
                    role={(m as AnyRecord)?.role}
                    name={(m as AnyRecord)?.name}
                    context={context}
                    onRemove={() => {
                      if (readOnly) return;
                      setMemberToRemove({
                        weekId,
                        dayIdx: i,
                        listKey,
                        idx,
                        memberName: (m as AnyRecord)?.name || t('team.thisMember')
                      });
                    }}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            <div className='flex justify-center'>
            <TextAreaAuto
              value={(day as AnyRecord)[notesKey] || ''}
              onChange={(v: string) => !readOnly && setCell(weekId, i, notesKey, v)}
              placeholder={t('needs.addNotes')}
              readOnly={readOnly}
            />
            </div>
          </Td>
        );
      })}
      </tr>
      {memberToRemove && (
        <ConfirmModal
          title={t('needs.confirmDeletion')}
          message={t('needs.confirmDeleteMember', { name: memberToRemove.memberName })}
          onClose={() => setMemberToRemove(null)}
          onConfirm={() => {
            removeFromList(
              memberToRemove.weekId,
              memberToRemove.dayIdx,
              memberToRemove.listKey,
              memberToRemove.idx
            );
          }}
        />
      )}
    </>
  );
}


