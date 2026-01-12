import { AnyRecord } from '@shared/types/common';
import { Td, Row } from '@shared/components';
import { BaseRowProps } from './TableRowComponentsTypes';

// Helper function to validate if a time string is in valid HH:MM format
const isValidTime = (time: string | null | undefined): boolean => {
  if (!time) return false;
  // Valid format: HH:MM where HH is 00-23 and MM is 00-59
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

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
          <div className='flex gap-1 sm:gap-1.5 md:gap-2 justify-center'>
            <div className='relative'>
              <input
                type='time'
                value={day.start || ''}
                onChange={e =>
                  !readOnly &&
                  setDayField(scope, week.id as string, i, {
                    start: e.target.value,
                  })
                }
                placeholder='--:--'
                className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={
                  !isValidTime(day.start)
                    ? {
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent',
                        caretColor: 'transparent',
                      }
                    : undefined
                }
                disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                readOnly={readOnly}
                title={readOnly ? t('conditions.projectClosed') : t('planning.start')}
              />
              {!isValidTime(day.start) && (
                <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                  --:--
                </div>
              )}
            </div>
            <div className='relative'>
              <input
                type='time'
                value={day.end || ''}
                onChange={e =>
                  !readOnly && setDayField(scope, week.id as string, i, { end: e.target.value })
                }
                placeholder='--:--'
                className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={
                  !isValidTime(day.end)
                    ? {
                        color: 'transparent',
                        WebkitTextFillColor: 'transparent',
                        caretColor: 'transparent',
                      }
                    : undefined
                }
                disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                readOnly={readOnly}
                title={readOnly ? t('conditions.projectClosed') : t('planning.end')}
              />
              {!isValidTime(day.end) && (
                <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                  --:--
                </div>
              )}
            </div>
          </div>
        </Td>
      ))}
    </Row>
  );
}

