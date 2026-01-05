import React from 'react';
import { Td, Row } from '@shared/components';
import Button from '@shared/components/Button';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { AnyRecord } from '@shared/types/common';
import { AddPrelightDropdown } from '../AddPrelightDropdown';
import { MemberChip } from './MemberChip';

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
        <span className='inline-flex items-center gap-2'>
          <ToggleIconButton
            isOpen={preOpen}
            onClick={() => setPreOpen(v => !v)}
            disabled={readOnly}
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
              <div className='flex flex-col gap-2'>
                <div className='flex gap-2 justify-center'>
                  <input
                    type='time'
                    value={day.prelightStart || ''}
                    onChange={e =>
                      !readOnly &&
                      setDayField(scope, week.id as string, i, {
                        prelightStart: e.target.value,
                      })
                    }
                    className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    readOnly={readOnly}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.startPrelight')}
                  />
                  <input
                    type='time'
                    value={day.prelightEnd || ''}
                    onChange={e =>
                      !readOnly &&
                      setDayField(scope, week.id as string, i, {
                        prelightEnd: e.target.value,
                      })
                    }
                    className={`px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={readOnly || day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    readOnly={readOnly}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.endPrelight')}
                  />
                </div>
                <div className='flex flex-wrap gap-2 justify-center'>
                  {(day.prelight || []).map((m: AnyRecord, idx: number) => (
                    <span key={idx} className='inline-flex items-center gap-2'>
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
                        className={readOnly ? 'opacity-50 cursor-not-allowed' : ''}
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

