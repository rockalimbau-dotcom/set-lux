import { Td, Row } from '@shared/components';
import React from 'react';

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

type FieldRowProps = {
  weekId: string;
  weekObj: AnyRecord;
  fieldKey: string;
  label: string;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
};

export default function FieldRow({ weekId, weekObj, fieldKey, label, setCell }: FieldRowProps) {
  return (
    <Row label={label}>
      {DAYS.map((d, i) => (
        <Td key={d.key} align='center' className='text-center'>
          <div className='flex justify-center'>
            <TextAreaAuto
              value={(weekObj?.days?.[i]?.[fieldKey] as string) || ''}
              onChange={(val: string) => setCell(weekId, i, fieldKey, val)}
              placeholder='Escribe aquí…'
            />
          </div>
        </Td>
      ))}
    </Row>
  );
}


