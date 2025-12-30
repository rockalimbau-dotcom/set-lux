import { Td, Row } from '@shared/components';
import React, { useState, useEffect } from 'react';

import Chip from './Chip';
import TextAreaAuto from './TextAreaAuto';

interface ConfirmModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, onClose, onConfirm }: ConfirmModalProps) {
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
    <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
      <div 
        className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
        style={{
          backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
        }}
      >
        <h3 
          className='text-lg font-semibold mb-4' 
          style={{
            color: isLight ? '#0476D9' : '#F27405'
          }}
        >
          {title}
        </h3>
        
        <p 
          className='text-sm mb-6' 
          style={{color: isLight ? '#111827' : '#d1d5db'}}
          dangerouslySetInnerHTML={{
            __html: message
          }}
        />

        <div className='flex justify-center gap-3'>
          <button
            onClick={onClose}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: 'var(--border)',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
              color: isLight ? '#111827' : '#d1d5db'
            }}
            type='button'
          >
            No
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
            style={{
              borderColor: isLight ? '#F27405' : '#F27405',
              color: isLight ? '#F27405' : '#F27405',
              backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
            }}
            type='button'
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
}

type AnyRecord = Record<string, any>;

const DAYS = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
];

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
};

export default function ListRow({ label, listKey, notesKey, weekId, weekObj, context, removeFromList, setCell, readOnly = false }: ListRowProps) {
  const [memberToRemove, setMemberToRemove] = useState<{
    weekId: string;
    dayIdx: number;
    listKey: string;
    idx: number;
    memberName: string;
  } | null>(null);

  return (
    <>
      <Row label={label}>
        {DAYS.map((d, i) => {
          const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
          const list = Array.isArray(day[listKey]) ? (day[listKey] as AnyRecord[]) : [];
          return (
            <Td key={d.key} align='middle' className='text-center'>
              <div className='flex flex-wrap gap-2 mb-2 justify-center'>
                {list.length === 0 && (
                  <span className='text-xs text-zinc-400'>—</span>
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
                        memberName: (m as AnyRecord)?.name || 'este miembro'
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
              placeholder='Añade notas…'
              readOnly={readOnly}
            />
            </div>
          </Td>
        );
      })}
    </Row>
    {memberToRemove && (
      <ConfirmModal
        title='Confirmar eliminación'
        message={`¿Estás seguro de eliminar a <strong>${memberToRemove.memberName}</strong>?`}
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


