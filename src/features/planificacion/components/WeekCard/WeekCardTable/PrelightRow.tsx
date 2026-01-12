import React from 'react';
import { Td, Row } from '@shared/components';
import Button from '@shared/components/Button';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { AnyRecord } from '@shared/types/common';
import { AddPrelightDropdown } from '../AddPrelightDropdown';
import { MemberChip } from './MemberChip';

// Helper function to validate if a time string is in valid HH:MM format
const isValidTime = (time: string | null | undefined): boolean => {
  if (!time) return false;
  // Valid format: HH:MM where HH is 00-23 and MM is 00-59
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

interface PrelightRowProps {
  week: AnyRecord;
  scope: 'pre' | 'pro';
  setDayField: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, patch: AnyRecord) => void;
  getDropdownState: (key: string) => {
    isOpen: boolean;
    hoveredOption: string | null;
    isButtonHovered: boolean;
  };
  setDropdownState: (
    key: string,
    updates: Partial<{
      isOpen: boolean;
      hoveredOption: string | null;
      isButtonHovered: boolean;
    }>
  ) => void;
  addMemberTo: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => void;
  setMemberToRemove: (member: {
    scope: 'pre' | 'pro';
    weekId: string;
    dayIndex: number;
    listKey: 'team' | 'prelight' | 'pickup';
    idx: number;
    memberName: string;
  } | null) => void;
  prelightTeam: AnyRecord[];
  baseTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  missingByPair: (dayList: AnyRecord[], pool: AnyRecord[]) => AnyRecord[];
  uniqueByPair: (arr: AnyRecord[]) => AnyRecord[];
  poolRefs: (reinf: AnyRecord[]) => AnyRecord[];
  preOpen: boolean;
  setPreOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
  t: (key: string) => string;
}

export function PrelightRow({
  week,
  scope,
  setDayField,
  addMemberTo,
  setMemberToRemove,
  prelightTeam,
  baseTeam,
  reinforcements,
  missingByPair,
  uniqueByPair,
  poolRefs,
  getDropdownState,
  setDropdownState,
  preOpen,
  setPreOpen,
  theme,
  focusColor,
  readOnly = false,
  t,
}: PrelightRowProps) {
  return (
    <Row
      label={
        <span className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <ToggleIconButton
            isOpen={preOpen}
            onClick={() => setPreOpen(v => !v)}
            disabled={readOnly}
            className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6'
          />
          {t('planning.prelight')}
        </span>
      }
    >
      {week.days.map((day: AnyRecord, i: number) => {
        const prePool = uniqueByPair([
          ...prelightTeam.map(m => ({ ...m, source: 'pre' })),
          ...baseTeam.map(m => ({ ...m, source: 'base' })),
          ...poolRefs(reinforcements),
        ]);
        const options = missingByPair(day.prelight, prePool);
        return (
          <Td key={i} align='middle'>
            {preOpen && (
              <div className='flex flex-col gap-1 sm:gap-1.5 md:gap-2'>
                <div className='flex gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  <div className='relative'>
                    <input
                      type='time'
                      value={day.prelightStart || ''}
                      onChange={e =>
                        !readOnly &&
                        setDayField(scope, week.id as string, i, {
                          prelightStart: e.target.value,
                        })
                      }
                      onBlur={e => {
                        if (!readOnly && e.target.value) {
                          const normalized = normalizeTime(e.target.value);
                          if (normalized !== e.target.value) {
                            setDayField(scope, week.id as string, i, {
                              prelightStart: normalized,
                            });
                          }
                        }
                      }}
                      placeholder='--:--'
                      className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                        readOnly ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={
                        !isValidTime(day.prelightStart)
                          ? {
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                              caretColor: 'transparent',
                            }
                          : undefined
                      }
                      disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.startPrelight')}
                    />
                    {!isValidTime(day.prelightStart) && (
                      <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                        --:--
                      </div>
                    )}
                  </div>
                  <div className='relative'>
                    <input
                      type='time'
                      value={day.prelightEnd || ''}
                      onChange={e =>
                        !readOnly &&
                        setDayField(scope, week.id as string, i, {
                          prelightEnd: e.target.value,
                        })
                      }
                      placeholder='--:--'
                      className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                        readOnly ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={
                        !isValidTime(day.prelightEnd)
                          ? {
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                              caretColor: 'transparent',
                            }
                          : undefined
                      }
                      disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.endPrelight')}
                    />
                    {!isValidTime(day.prelightEnd) && (
                      <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                        --:--
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  {(day.prelight || []).map((m: AnyRecord, idx: number) => (
                    <span key={idx} className='inline-flex items-center gap-0.5 sm:gap-1 md:gap-2'>
                      <MemberChip role={m.role} name={m.name} source={m.source} />
                      <Button
                        variant='remove'
                        size='sm'
                        onClick={() => {
                          if (readOnly) return;
                          setMemberToRemove({
                            scope,
                            weekId: week.id as string,
                            dayIndex: i,
                            listKey: 'prelight',
                            idx,
                            memberName: m.name || 'este miembro',
                          });
                        }}
                        disabled={readOnly}
                        title={readOnly ? t('conditions.projectClosed') : t('planning.remove')}
                        className={`px-1 py-0.5 sm:px-1.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        ×
                      </Button>
                    </span>
                  ))}
                  <AddPrelightDropdown
                    scope={scope}
                    weekId={week.id as string}
                    dayIndex={i}
                    day={day}
                    dropdownKey={`prelight_${week.id}_${i}`}
                    dropdownState={getDropdownState(`prelight_${week.id}_${i}`)}
                    setDropdownState={setDropdownState}
                    addMemberTo={addMemberTo}
                    options={options}
                    theme={theme}
                    focusColor={focusColor}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}
          </Td>
        );
      })}
    </Row>
  );
}

