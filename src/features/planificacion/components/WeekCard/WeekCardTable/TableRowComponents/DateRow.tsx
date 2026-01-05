import React from 'react';
import { Td, Row } from '@shared/components';
import { DAYS } from '../../WeekCardHelpers';
import { DateRowProps } from './TableRowComponentsTypes';

export function DateRow({
  week,
  datesRow,
  onChangeMonday,
  readOnly = false,
  t,
}: DateRowProps) {
  return (
    <Row label={t('planning.date')}>
      {DAYS.map((d, i) => (
        <Td key={i} align='middle'>
          <div className='text-center flex items-center justify-center h-full'>
            {i === 0 ? (
              <input
                type='date'
                value={week.startDate}
                onChange={onChangeMonday}
                disabled={readOnly}
                className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={readOnly ? t('conditions.projectClosed') : t('planning.changeMonday')}
              />
            ) : (
              datesRow[i]
            )}
          </div>
        </Td>
      ))}
    </Row>
  );
}

