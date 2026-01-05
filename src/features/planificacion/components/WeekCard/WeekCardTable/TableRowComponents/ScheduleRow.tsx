import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import { BaseRowProps } from './TableRowComponentsTypes';

export function ScheduleRow({
  week,
  scope,
  setDayField,
  readOnly = false,
  t,
}: BaseRowProps) {
  return (
    <Row label={t('planning.schedule')}>
      {week.days.map((day: AnyRecord, i: number) => (
        <Td key={i} align='middle'>
          <div className='flex gap-2 justify-center'>
            <input
              type='time'
              value={day.start || ''}
              onChange={e =>
                !readOnly &&
                setDayField(scope, week.id as string, i, {
                  start: e.target.value,
                })
              }
              className={`flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${
                readOnly ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
              readOnly={readOnly}
              title={readOnly ? t('conditions.projectClosed') : t('planning.start')}
            />
            <input
              type='time'
              value={day.end || ''}
              onChange={e =>
                !readOnly && setDayField(scope, week.id as string, i, { end: e.target.value })
              }
              className={`flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${
                readOnly ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
              readOnly={readOnly}
              title={readOnly ? t('conditions.projectClosed') : t('planning.end')}
            />
          </div>
        </Td>
      ))}
    </Row>
  );
}

