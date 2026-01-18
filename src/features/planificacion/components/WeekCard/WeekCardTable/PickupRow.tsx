import React from 'react';
import { Td, Row } from '@shared/components';
import Button from '@shared/components/Button';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { AnyRecord } from '@shared/types/common';
import { AddPickupDropdown } from '../AddPickupDropdown';
import { MemberChip } from './MemberChip';
import { JornadaDropdown } from '../JornadaDropdown';

// Helper function to validate if a time string is in valid HH:MM format
const isValidTime = (time: string | null | undefined): boolean => {
  if (!time) return false;
  // Valid format: HH:MM where HH is 00-23 and MM is 00-59
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

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
        
        // Obtener el tipo de jornada de pickup (o el valor por defecto)
        const pickupTipo = day.pickupTipo || (day.tipo === 'Descanso' || day.tipo === 'Fin' ? day.tipo : 'Descanso');
        const isPickupRestDay = pickupTipo === 'Descanso' || pickupTipo === 'Fin';
        
        return (
          <Td key={i} align='middle'>
            {pickOpen && (
              <div className='flex flex-col gap-1 sm:gap-1.5 md:gap-2'>
                {/* Fila de Jornada */}
                <div className='w-full'>
                  <JornadaDropdown
                    scope={scope}
                    weekId={week.id as string}
                    dayIndex={i}
                    day={{
                      ...day,
                      tipo: pickupTipo,
                    }}
                    dropdownKey={`pickup_jornada_${week.id}_${i}`}
                    dropdownState={getDropdownState(`pickup_jornada_${week.id}_${i}`)}
                    setDropdownState={setDropdownState}
                    setDayField={(scope, weekId, dayIdx, patch) => {
                      // Guardar el tipo específico de pickup
                      const update: AnyRecord = { pickupTipo: patch.tipo };
                      // Si cambiamos a Descanso o Fin, limpiar la localización de pickup
                      if (patch.tipo === 'Descanso' || patch.tipo === 'Fin') {
                        update.pickupLoc = patch.tipo === 'Descanso' ? 'DESCANSO' : 'FIN DEL RODAJE';
                      }
                      setDayField(scope, weekId, dayIdx, update);
                    }}
                    theme={theme}
                    focusColor={focusColor}
                    readOnly={readOnly}
                    withoutTd={true}
                    excludeOptions={['Fin']}
                  />
                </div>
                <div className='flex gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  <div className='relative'>
                    <input
                      type='time'
                      value={day.pickupStart || ''}
                      onChange={e =>
                        !readOnly &&
                        setDayField(scope, week.id as string, i, {
                          pickupStart: e.target.value,
                        })
                      }
                      onBlur={() => {
                        // El valor ya está normalizado por el input type="time"
                      }}
                      placeholder='--:--'
                      className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                        readOnly ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={
                        !isValidTime(day.pickupStart)
                          ? {
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                              caretColor: 'transparent',
                            }
                          : undefined
                      }
                      disabled={readOnly || isPickupRestDay}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.startPickup')}
                    />
                    {!isValidTime(day.pickupStart) && (
                      <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                        --:--
                      </div>
                    )}
                  </div>
                  <div className='relative'>
                    <input
                      type='time'
                      value={day.pickupEnd || ''}
                      onChange={e =>
                        !readOnly &&
                        setDayField(scope, week.id as string, i, {
                          pickupEnd: e.target.value,
                        })
                      }
                      placeholder='--:--'
                      className={`px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                        readOnly ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={
                        !isValidTime(day.pickupEnd)
                          ? {
                              color: 'transparent',
                              WebkitTextFillColor: 'transparent',
                              caretColor: 'transparent',
                            }
                          : undefined
                      }
                      disabled={readOnly || isPickupRestDay}
                      readOnly={readOnly}
                      title={readOnly ? t('conditions.projectClosed') : t('planning.endPickup')}
                    />
                    {!isValidTime(day.pickupEnd) && (
                      <div className='absolute inset-0 flex items-center px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 pointer-events-none text-[9px] sm:text-[10px] md:text-xs text-zinc-400'>
                        --:--
                      </div>
                    )}
                  </div>
                </div>
                {/* Fila de Localización */}
                <div className='w-full'>
                  <input
                    type='text'
                    placeholder={
                      pickupTipo === 'Descanso'
                        ? t('planning.restLocation')
                        : pickupTipo === 'Fin'
                          ? t('planning.endLocation')
                          : t('planning.locationPlaceholder')
                    }
                    value={
                      pickupTipo === 'Descanso' && day.pickupLoc === 'DESCANSO'
                        ? t('planning.restLocation')
                        : pickupTipo === 'Fin' && day.pickupLoc === 'FIN DEL RODAJE'
                          ? t('planning.endLocation')
                          : day.pickupLoc || ''
                    }
                    onChange={e => !readOnly && setDayField(scope, week.id as string, i, { pickupLoc: e.target.value })}
                    onBlur={e => !readOnly && setDayField(scope, week.id as string, i, { pickupLoc: e.target.value })}
                    className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-left text-[9px] sm:text-[10px] md:text-xs ${
                      readOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={readOnly || isPickupRestDay}
                    title={readOnly ? t('conditions.projectClosed') : t('planning.location')}
                  />
                </div>
                <div className='flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 justify-center'>
                  {(day.pickup || []).map((m: AnyRecord, idx: number) => (
                    <span key={idx} className='inline-flex items-center gap-0.5 sm:gap-1 md:gap-2'>
                      <MemberChip role={m.role} name={m.name} source={m.source} gender={m.gender} />
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
                    day={{
                      ...day,
                      tipo: pickupTipo,
                    }}
                    dropdownKey={`pickup_${week.id}_${i}`}
                    dropdownState={getDropdownState(`pickup_${week.id}_${i}`)}
                    setDropdownState={setDropdownState}
                    addMemberTo={addMemberTo}
                    options={options}
                    theme={theme}
                    focusColor={focusColor}
                    readOnly={readOnly || isPickupRestDay}
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

