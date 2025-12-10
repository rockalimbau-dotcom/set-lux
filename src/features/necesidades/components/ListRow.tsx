import { Td, Row } from '@shared/components';
import React from 'react';

import Chip from './Chip';
import TextAreaAuto from './TextAreaAuto';

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
};

export default function ListRow({ label, listKey, notesKey, weekId, weekObj, context, removeFromList, setCell }: ListRowProps) {
  return (
    <Row label={label}>
      {DAYS.map((d, i) => {
        const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
        const list = Array.isArray(day[listKey]) ? (day[listKey] as AnyRecord[]) : [];
        return (
          <Td key={d.key} align='center' className='text-center'>
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
                  onRemove={() => removeFromList(weekId, i, listKey, idx)}
                />
              ))}
            </div>
            <div className='flex justify-center'>
              <TextAreaAuto
                value={(day as AnyRecord)[notesKey] || ''}
                onChange={(v: string) => setCell(weekId, i, notesKey, v)}
                placeholder='Añade notas…'
              />
            </div>
          </Td>
        );
      })}
    </Row>
  );
}


