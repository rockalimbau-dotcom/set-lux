import { Th, Td, Row, Button } from '@shared/components';
import ChipBase from '@shared/components/Chip';
import ToggleIconButton from '@shared/components/ToggleIconButton';
import { ROLE_COLORS } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useMemo, useCallback } from 'react';

type AnyRecord = Record<string, any>;

type WeekCardProps = {
  scope: 'pre' | 'pro';
  week: AnyRecord;
  duplicateWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  deleteWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  setWeekStart: (scope: 'pre' | 'pro', weekId: string, date: string) => void;
  setDayField: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    patch: AnyRecord
  ) => void;
  addMemberTo: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => void;
  removeMemberFrom: (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    idxInList: number
  ) => void;
  baseTeam: AnyRecord[];
  prelightTeam: AnyRecord[];
  pickupTeam: AnyRecord[];
  reinforcements: AnyRecord[];
  onExportWeek: () => void;
  onExportWeekPDF: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  teamList: AnyRecord[];
  project?: AnyRecord;
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (date: Date, days: number) => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};
const formatDDMMYYYY = (date: Date) =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

const DAYS = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
];

function WeekCard({
  scope,
  week,
  duplicateWeek,
  deleteWeek,
  setWeekStart,
  setDayField,
  addMemberTo,
  removeMemberFrom,
  baseTeam,
  prelightTeam,
  pickupTeam,
  reinforcements,
  onExportWeek,
  onExportWeekPDF,
  btnExportCls,
  btnExportStyle,
  teamList,
  project,
}: WeekCardProps) {
  const weekStart = useMemo(() => parseYYYYMMDD(week.startDate as string), [week.startDate]);
  const datesRow = useMemo(() => DAYS.map((_, i) => formatDDMMYYYY(addDays(weekStart, i))), [weekStart]);
  const onChangeMonday = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setWeekStart(scope, week.id as string, e.target.value), [scope, week.id, setWeekStart]);

  const [open, setOpen] = useLocalStorage<boolean>(`wk_open_${week.id}`, true);
  const [preOpen, setPreOpen] = useLocalStorage<boolean>(
    `wk_pre_open_${week.id}`,
    false
  );
  const [pickOpen, setPickOpen] = useLocalStorage<boolean>(
    `wk_pick_open_${week.id}`,
    false
  );

  const pair = useCallback((m: AnyRecord) => `${m.role || ''}::${m.name || ''}`, []);
  const missingByPair = useCallback((dayList: AnyRecord[] = [], pool: AnyRecord[] = []) => {
    const present = new Set((dayList || []).map(pair));
    return (pool || []).filter(m => {
      const nm = (m?.name || '').trim();
      if (nm === '') return true;
      return !present.has(`${m.role || ''}::${nm}`);
    });
  }, [pair]);
  const uniqueByPair = useCallback((arr: AnyRecord[] = []) => {
    const seen = new Set<string>();
    const out: AnyRecord[] = [];
    for (const m of arr) {
      const key = `${m?.role || ''}::${(m?.name || '').trim()}::${m?.source || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m);
      }
    }
    return out;
  }, []);
  const poolRefs = useCallback((reinf: AnyRecord[] = []) => (reinf || []).map(r => ({
    role: 'REF',
    name: (r?.name || '').trim(),
    source: 'ref',
  })), []);

  const Chip = ({ role, name, source }: { role: string; name: string; source?: string }) => {
    const col = (ROLE_COLORS as AnyRecord)[role] || { bg: '#444', fg: '#fff' };
    const roleLabels: AnyRecord = {
      G: 'G',
      BB: 'BB',
      E: 'E',
      TM: 'TM',
      FB: 'FB',
      AUX: 'AUX',
      M: 'M',
      REF: 'R',
    };
    let label: string = roleLabels[role] || role;
    if (role !== 'REF') {
      if (source === 'pre') label = `${label}P`;
      if (source === 'pick') label = `${label}R`;
    }
    return (
      <ChipBase label={label} colorBg={col.bg} colorFg={col.fg} text={name} />
    );
  };

  return (
    <div
      id={`wk-${week.id}`}
      className='wk-card rounded-2xl border border-neutral-border bg-neutral-panel/90'
    >
      <div className='flex items-center justify-between gap-3 px-5 py-4'>
        <div className='flex items-center gap-3'>
          <ToggleIconButton
            isOpen={open}
            onClick={() => setOpen(v => !v)}
            className='w-8 h-8'
          />
          <div className='text-brand font-semibold'>{week.label}</div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='export'
            size='sm'
            className={`no-pdf ${btnExportCls || ''}`}
            style={{...btnExportStyle, background: '#f59e0b'}}
            onClick={onExportWeekPDF}
            title='Exportar semana (PDF)'
          >
            PDF
          </Button>
          <Button
            variant='duplicate'
            size='sm'
            className='no-pdf'
            onClick={() => duplicateWeek(scope, week.id as string)}
            title='Duplicar semana'
            type='button'
          >
            Duplicar
          </Button>
          <Button
            variant='danger'
            size='sm'
            className='no-pdf'
            onClick={() => deleteWeek(scope, week.id as string)}
            title='Eliminar semana'
            type='button'
          >
            🗑️
          </Button>
        </div>
      </div>

      {open && (
        <div className='overflow-x-auto'>
          <table className='plan min-w-[760px] w-full border-collapse text-sm'>
            <thead>
              <tr>
                <Th>Fila / Día</Th>
                {week.days.map((d: AnyRecord, i: number) => (
                  <Th key={i}>{d.name}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label='Fecha'>
                {DAYS.map((d, i) => (
                  <Td key={i}>
                    {i === 0 ? (
                      <input
                        type='date'
                        value={week.startDate}
                        onChange={onChangeMonday}
                        className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                        title='Cambiar lunes'
                      />
                    ) : (
                      datesRow[i]
                    )}
                  </Td>
                ))}
              </Row>

              <Row label='Jornada'>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i}>
                    <select
                      value={day.tipo}
                      onChange={e =>
                        setDayField(scope, week.id as string, i, { tipo: e.target.value })
                      }
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                    >
                      <option>Rodaje</option>
                      <option>Carga</option>
                      <option>Descarga</option>
                      <option>Localizar</option>
                      <option>Travel Day</option>
                      <option>Rodaje Festivo</option>
                      <option>Fin</option>
                      <option>Descanso</option>
                    </select>
                  </Td>
                ))}
              </Row>

              <Row label='Horario'>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i}>
                    <div className='flex gap-2'>
                      <input
                        type='time'
                        value={day.start || ''}
                        onChange={e =>
                          setDayField(scope, week.id as string, i, {
                            start: e.target.value,
                          })
                        }
                        className='flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                        disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                        title='Inicio'
                      />
                      <input
                        type='time'
                        value={day.end || ''}
                        onChange={e =>
                          setDayField(scope, week.id as string, i, { end: e.target.value })
                        }
                        className='flex-1 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                        disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                        title='Fin'
                      />
                    </div>
                  </Td>
                ))}
              </Row>

              <Row label='Corte cámara'>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i}>
                    <input
                      type='time'
                      value={day.cut || ''}
                      onChange={e =>
                        setDayField(scope, week.id as string, i, { cut: e.target.value })
                      }
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                      disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    />
                  </Td>
                ))}
              </Row>

              <Row label='Localización'>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i}>
                    <input
                      type='text'
                      placeholder={
                        day.tipo === 'Descanso'
                          ? 'DESCANSO'
                          : day.tipo === 'Fin'
                          ? 'FIN DEL RODAJE'
                          : 'Rodaje / Dirección / Calle...'
                      }
                      value={day.loc || ''}
                      onChange={e =>
                        setDayField(scope, week.id as string, i, { loc: e.target.value })
                      }
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                      disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                    />
                  </Td>
                ))}
              </Row>

              <Row label='Equipo'>
                {week.days.map((day: AnyRecord, i: number) => {
                  const basePool = (baseTeam || []).map(m => ({
                    role: m.role,
                    name: (m.name || '').trim(),
                    source: 'base',
                  }));
                  const options = missingByPair(
                    day.team,
                    uniqueByPair([...basePool, ...poolRefs(reinforcements)])
                  );
                  return (
                    <Td key={i}>
                      <div className='flex flex-wrap gap-2'>
                        {(day.team || []).map((m: AnyRecord, idx: number) => (
                          <span
                            key={idx}
                            className='inline-flex items-center gap-2'
                          >
                            <Chip
                              role={m.role}
                              name={m.name}
                              source={m.source}
                            />
                            <Button
                              variant='remove'
                              size='sm'
                              className='no-pdf'
                              onClick={() =>
                                removeMemberFrom(scope, week.id as string, i, 'team', idx)
                              }
                              title='Quitar'
                            >
                              ×
                            </Button>
                          </span>
                        ))}
                        {day.tipo !== 'Descanso' && day.tipo !== 'Fin' && (
                          <select
                            className='no-pdf px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                            onChange={e => {
                              const v = e.target.value;
                              if (!v) return;
                              const [role, name] = v.split('::');
                              addMemberTo(scope, week.id as string, i, 'team', {
                                role,
                                name,
                              });
                              e.target.value = '';
                            }}
                            defaultValue=''
                          >
                            <option value=''>+ Añadir</option>
                            {options.map((p: AnyRecord, ii: number) => (
                              <option
                                key={`${p.role}-${p.name}-${ii}`}
                                value={`${p.role}::${p.name}`}
                              >
                                {p.role} · {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </Td>
                  );
                })}
              </Row>

              <Row
                label={
                  <span className='inline-flex items-center gap-2'>
                    <ToggleIconButton
                      isOpen={preOpen}
                      onClick={() => setPreOpen(v => !v)}
                    />
                    Prelight
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
                    <Td key={i}>
                      {preOpen && (
                        <div className='flex flex-col gap-2'>
                          <div className='flex gap-2'>
                            <input
                              type='time'
                              value={day.prelightStart || ''}
                              onChange={e =>
                                setDayField(scope, week.id as string, i, {
                                  prelightStart: e.target.value,
                                })
                              }
                              className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                              disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              title='Inicio prelight'
                            />
                            <input
                              type='time'
                              value={day.prelightEnd || ''}
                              onChange={e =>
                                setDayField(scope, week.id as string, i, {
                                  prelightEnd: e.target.value,
                                })
                              }
                              className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                              disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              title='Fin prelight'
                            />
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {(day.prelight || []).map((m: AnyRecord, idx: number) => (
                              <span
                                key={idx}
                                className='inline-flex items-center gap-2'
                              >
                                <Chip
                                  role={m.role}
                                  name={m.name}
                                  source={m.source}
                                />
                                <Button
                                  variant='remove'
                                  size='sm'
                                  onClick={() =>
                                    removeMemberFrom(
                                      scope,
                                      week.id as string,
                                      i,
                                      'prelight',
                                      idx
                                    )
                                  }
                                  title='Quitar'
                                >
                                  ×
                                </Button>
                              </span>
                            ))}
                            {day.tipo !== 'Descanso' && day.tipo !== 'Fin' && (
                              <select
                                onChange={e => {
                                  const v = e.target.value;
                                  if (!v) return;
                                  const [role, name, source] = v.split('::');
                                  addMemberTo(scope, week.id as string, i, 'prelight', {
                                    role,
                                    name,
                                    source,
                                  });
                                  e.target.value = '';
                                }}
                                className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                                defaultValue=''
                              >
                                <option value=''>+ Añadir</option>
                                {options.map((p: AnyRecord, ii: number) => {
                                  const displayRole =
                                    p.source === 'pre' && p.role !== 'REF'
                                      ? `${p.role}P`
                                      : p.role;
                                  return (
                                    <option
                                      key={`${p.role}-${p.name}-${ii}`}
                                      value={`${p.role}::${p.name}::pre`}
                                    >
                                      {displayRole} · {p.name}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </Td>
                  );
                })}
              </Row>

              <Row
                label={
                  <span className='inline-flex items-center gap-2'>
                    <ToggleIconButton
                      isOpen={pickOpen}
                      onClick={() => setPickOpen(v => !v)}
                    />
                    Recogida
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
                    <Td key={i}>
                      {pickOpen && (
                        <div className='flex flex-col gap-2'>
                          <div className='flex gap-2'>
                            <input
                              type='time'
                              value={day.pickupStart || ''}
                              onChange={e =>
                                setDayField(scope, week.id as string, i, {
                                  pickupStart: e.target.value,
                                })
                              }
                              className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                              disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              title='Inicio recogida'
                            />
                            <input
                              type='time'
                              value={day.pickupEnd || ''}
                              onChange={e =>
                                setDayField(scope, week.id as string, i, {
                                  pickupEnd: e.target.value,
                                })
                              }
                              className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text sm'
                              disabled={day.tipo === 'Descanso' || day.tipo === 'Fin'}
                              title='Fin recogida'
                            />
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {(day.pickup || []).map((m: AnyRecord, idx: number) => (
                              <span
                                key={idx}
                                className='inline-flex items-center gap-2'
                              >
                                <Chip
                                  role={m.role}
                                  name={m.name}
                                  source={m.source}
                                />
                                <Button
                                  variant='remove'
                                  size='sm'
                                  onClick={() =>
                                    removeMemberFrom(
                                      scope,
                                      week.id as string,
                                      i,
                                      'pickup',
                                      idx
                                    )
                                  }
                                  title='Quitar'
                                >
                                  ×
                                </Button>
                              </span>
                            ))}
                            {day.tipo !== 'Descanso' && day.tipo !== 'Fin' && (
                              <select
                                onChange={e => {
                                  const v = e.target.value;
                                  if (!v) return;
                                  const [role, name, source] = v.split('::');
                                  addMemberTo(scope, week.id as string, i, 'pickup', {
                                    role,
                                    name,
                                    source,
                                  });
                                  e.target.value = '';
                                }}
                                className='px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                                defaultValue=''
                              >
                                <option value=''>+ Añadir</option>
                                {options.map((p: AnyRecord, ii: number) => {
                                  const displayRole =
                                    p.source === 'pick' && p.role !== 'REF'
                                      ? `${p.role}R`
                                      : p.role;
                                  return (
                                    <option
                                      key={`${p.role}-${p.name}-${ii}`}
                                      value={`${p.role}::${p.name}::pick`}
                                    >
                                      {displayRole} · {p.name}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </Td>
                  );
                })}
              </Row>

              <Row label='Incidencias'>
                {week.days.map((day: AnyRecord, i: number) => (
                  <Td key={i}>
                    <input
                      type='text'
                      value={day.issue || ''}
                      onChange={e =>
                        setDayField(scope, week.id as string, i, {
                          issue: e.target.value,
                        })
                      }
                      className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand'
                    />
                  </Td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default React.memo(WeekCard);
