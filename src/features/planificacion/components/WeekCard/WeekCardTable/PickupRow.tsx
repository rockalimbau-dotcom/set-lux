import React from 'react';
import { Td, Row } from '@shared/components';
import Button from '@shared/components/Button';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { AnyRecord } from '@shared/types/common';
import { AddPickupDropdown } from '../AddPickupDropdown';
import { MemberChip } from './MemberChip';

interface PickupRowProps {
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
  pickupTeam: AnyRecord[];
  baseTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  missingByPair: (dayList: AnyRecord[], pool: AnyRecord[]) => AnyRecord[];
  uniqueByPair: (arr: AnyRecord[]) => AnyRecord[];
  poolRefs: (reinf: AnyRecord[]) => AnyRecord[];
  pickOpen: boolean;
  setPickOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
  t: (key: string) => string;
}

export function PickupRow({
  week,
  scope,
  setDayField,
  addMemberTo,
  setMemberToRemove,
  pickupTeam,
  baseTeam,
  reinforcements,
  missingByPair,
  uniqueByPair,
  poolRefs,
  getDropdownState,
  setDropdownState,
  pickOpen,
  setPickOpen,
  theme,
  focusColor,
  readOnly = false,
  t,
}: PickupRowProps) {
  return (
    <Row
      label={
        <span className='inline-flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <ToggleIconButton
            isOpen={pickOpen}
            onClick={() => setPickOpen(v => !v)}
            disabled={readOnly}
            className='w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6'
          />
          {t('planning.pickup')}
        </span>
      }
    >
      {week.days.map((day: AnyRecord, i: number) => {
        const pickPool = uniqueByPair([
          ...pickupTeam.map(m => ({ ...m, source: 'pick' })),
          ...baseTeam.map(m => ({ ...m, source: 'base' })),
          ...poolRefs(reinforcements),
        ]);
        const options = missingByPair(day.pickup, pickPool);
        return (
          <Td key={i} align='middle'>
            {pickOpen && (
              <div className='flex flex-col gap-1 sm:gap-1.5 md:gap-2'>
                <div className='flex gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  <input
                    type='time'
                    value={day.pickupStart || ''}
                    onChange={e =>
                      !readOnly &&
                      setDayField(scope, week.id as string, i, {
                        pickupStart: e.target.value,
                      })
                    }
                    onBlur={e => {
                      if (!readOnly && e.target.value) {
                        const normalized = normalizeTime(e.target.value);
                        if (normalized !== e.target.value) {
                          setDayField(scope, week.id as string, i, {
                            pickupStart: normalized,
                          });
                        }
                      }
                    }}
                    className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    readOnly={readOnly}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.startPickup')}
                  />
                  <input
                    type='time'
                    value={day.pickupEnd || ''}
                    onChange={e =>
                      !readOnly &&
                      setDayField(scope, week.id as string, i, {
                        pickupEnd: e.target.value,
                      })
                    }
                    className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    readOnly={readOnly}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.endPickup')}
                  />
                </div>
                <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  {(day.pickup || []).map((m: AnyRecord, idx: number) => (
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
                            listKey: 'pickup',
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
                  <AddPickupDropdown
                    scope={scope}
                    weekId={week.id as string}
                    dayIndex={i}
                    day={day}
                    dropdownKey={`pickup_${week.id}_${i}`}
                    dropdownState={getDropdownState(`pickup_${week.id}_${i}`)}
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

