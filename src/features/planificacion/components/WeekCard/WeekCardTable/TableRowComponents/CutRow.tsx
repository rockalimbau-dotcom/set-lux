import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import { BaseRowProps } from './TableRowComponentsTypes';

export function CutRow({
  week,
  scope,
  setDayField,
  readOnly = false,
  t,
}: BaseRowProps) {
  return (
    <Row label={t('planning.cutRow')}>
      {week.days.map((day: AnyRecord, i: number) => (
        <Td key={i} align='middle'>
          <input
            type='time'
            value={day.cut || ''}
            onChange={e =>
              !readOnly && setDayField(scope, week.id as string, i, { cut: e.target.value })
            }
            className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
            readOnly={readOnly}
            title={readOnly ? t('conditions.projectClosed') : t('planning.cut')}
          />
        </Td>
      ))}
    </Row>
  );
}

