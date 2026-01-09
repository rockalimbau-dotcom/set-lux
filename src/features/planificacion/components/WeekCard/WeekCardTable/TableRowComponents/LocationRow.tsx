import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import { BaseRowProps } from './TableRowComponentsTypes';

export function LocationRow({
  week,
  scope,
  setDayField,
  readOnly = false,
  t,
}: BaseRowProps) {
  return (
    <Row label={t('planning.location')}>
      {week.days.map((day: AnyRecord, i: number) => (
        <Td key={i} align='middle'>
          <input
            type='text'
            placeholder={
              day.tipo === 'Descanso'
                ? t('planning.restLocation')
                : day.tipo === 'Fin'
                  ? t('planning.endLocation')
                  : t('planning.locationPlaceholder')
            }
            value={
              day.tipo === 'Descanso' && day.loc === 'DESCANSO'
                ? t('planning.restLocation')
                : day.tipo === 'Fin' && day.loc === 'FIN DEL RODAJE'
                  ? t('planning.endLocation')
                  : day.loc || ''
            }
            onChange={e => setDayField(scope, week.id as string, i, { loc: e.target.value })}
            className='w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs'
            disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
          />
        </Td>
      ))}
    </Row>
  );
}

