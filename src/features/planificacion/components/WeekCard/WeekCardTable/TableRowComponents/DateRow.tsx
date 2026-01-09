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
                className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
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

