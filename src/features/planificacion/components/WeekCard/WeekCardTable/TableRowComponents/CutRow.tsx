import { useState } from 'react';
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

// Helper function to format time input while typing
const formatTimeInput = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 4 digits
  const limited = digits.slice(0, 4);
  
  // Add colon after 2 digits
  if (limited.length <= 2) {
    return limited;
  }
  return `${limited.slice(0, 2)}:${limited.slice(2)}`;
};

export function CutRow({
  week,
  scope,
  setDayField,
  readOnly = false,
  t,
}: BaseRowProps) {
  const [focusedInputs, setFocusedInputs] = useState<Record<string, boolean>>({});

  return (
    <Row label={t('planning.cutRow')}>
      {week.days.map((day: AnyRecord, i: number) => {
        const cutKey = `${week.id}_${i}_cut`;
        const isCutFocused = focusedInputs[cutKey] || false;

        return (
          <Td key={i} align='middle'>
            <div className='flex justify-center'>
              <div className='relative'>
                <input
                  type='tel'
                  pattern='([0-1][0-9]|2[0-3]):[0-5][0-9]'
                  value={day.cut || ''}
                  onChange={e => {
                    if (!readOnly) {
                      const formatted = formatTimeInput(e.target.value);
                      setDayField(scope, week.id as string, i, { cut: formatted });
                    }
                  }}
                  onFocus={() => setFocusedInputs(prev => ({ ...prev, [cutKey]: true }))}
                  onBlur={() => setFocusedInputs(prev => ({ ...prev, [cutKey]: false }))}
                  placeholder='--:--'
                  maxLength={5}
                  className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-center text-[9px] sm:text-[10px] md:text-xs ${
                    readOnly ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={
                    !isValidTime(day.cut) && !isCutFocused
                      ? {
                          color: 'transparent',
                          WebkitTextFillColor: 'transparent',
                          caretColor: 'transparent',
                        }
                      : undefined
                  }
                  disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                  readOnly={readOnly}
                  title={readOnly ? t('conditions.projectClosed') : t('planning.cut')}
                />
                {!isValidTime(day.cut) && !isCutFocused && (
                  <div className='absolute inset-0 flex items-center justify-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                    --:--
                  </div>
                )}
              </div>
            </div>
          </Td>
        );
      })}
    </Row>
  );
}

