import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import { BaseRowProps } from './TableRowComponentsTypes';

export function ObservationsRow({
  week,
  scope,
  setDayField,
  readOnly = false,
  t,
}: BaseRowProps) {
  return (
    <Row label={t('planning.observations')}>
      {week.days.map((day: AnyRecord, i: number) => (
        <Td key={i} align='middle'>
          <input
            type='text'
            value={day.observations || ''}
            onChange={e =>
              !readOnly &&
              setDayField(scope, week.id as string, i, {
                observations: e.target.value,
              })
            }
            className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={readOnly}
            readOnly={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('planning.observations')}
          />
        </Td>
      ))}
    </Row>
  );
}
