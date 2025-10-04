import React, { useMemo } from 'react';
import { Td } from '@shared/components';
import { ROLE_COLORS } from '../../../shared/constants/roles';
import { personaKey as buildPersonaKey } from '../utils/model';

// Lightweight type aliases
type AnyRecord = Record<string, any>;

type Props = {
  list: AnyRecord[];
  block: 'base' | 'pre' | 'pick' | string;
  semana: readonly string[];
  collapsed: Record<string, boolean>;
  setCollapsed: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  data: AnyRecord;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
  findWeekAndDay: (iso: string) => AnyRecord;
  isPersonScheduledOnBlock: (
    fecha: string,
    visualRole: string,
    name: string,
    findWeekAndDay: (iso: string) => AnyRecord,
    block?: 'base' | 'pre' | 'pick' | string
  ) => boolean;
  CONCEPTS: readonly string[];
  DIETAS_OPCIONES: readonly (string | null)[];
  SI_NO: readonly string[];
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null };
  formatDietas: (items: Set<string>, ticket: number | null) => string;
};

function ReportPersonRows({
  list,
  block,
  semana,
  collapsed,
  setCollapsed,
  data,
  setCell,
  findWeekAndDay,
  isPersonScheduledOnBlock,
  CONCEPTS,
  DIETAS_OPCIONES,
  SI_NO,
  parseDietas,
  formatDietas,
}: Props) {
  if (!Array.isArray(list)) return null;

  const personaKeyFrom = (role: string, name: string) => {
    // Usar la misma clave que useReportData/model para evitar mezclas entre bloques
    const pLike: AnyRecord = { role, name };
    if (role === 'REF') {
      if (block === 'pre') pLike.__block = 'pre';
      if (block === 'pick') pLike.__block = 'pick';
    } else {
      if (block === 'pre') pLike.__block = 'pre';
      if (block === 'pick') pLike.__block = 'pick';
    }
    return buildPersonaKey(pLike);
  };

  const dietasOptions = useMemo(() => (DIETAS_OPCIONES.filter(Boolean) as string[]), [DIETAS_OPCIONES]);

  return (
    <>
      {list.map(p => {
        const visualRole = (p as AnyRecord)?.role || '';
        const name = (p as AnyRecord)?.name || '';
        const pKey = personaKeyFrom(visualRole, name);

        const baseRoleForColor = (visualRole || '').replace(/[PR]$/, '');
        const col = (ROLE_COLORS as AnyRecord)[baseRoleForColor] || { bg: '#444', fg: '#fff' };

        return (
          <React.Fragment key={`${pKey}__${block || 'base'}`}>
            <tr>
              <Td className='whitespace-nowrap align-middle' scope='row'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      setCollapsed(c => ({ ...c, [pKey]: !c[pKey] }))
                    }
                    className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
                    title={collapsed[pKey] ? 'Desplegar' : 'Contraer'}
                    aria-expanded={!collapsed[pKey]}
                    aria-controls={`person-${pKey}-rows`}
                    type='button'
                  >
                    {collapsed[pKey] ? '+' : '−'}
                  </button>

                  <span className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'>
                    <span
                      className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
                      style={{ background: col.bg, color: col.fg }}
                    >
                      {visualRole || '—'}
                    </span>
                    <span className='text-xs text-zinc-200'>{name}</span>
                    {visualRole === 'REF' && block && (
                      <span className='text-[10px] text-zinc-400 uppercase'>
                        · {block}
                      </span>
                    )}
                  </span>
                </div>
              </Td>

              {semana.map(iso => {
                const workedThisBlockHeader = isPersonScheduledOnBlock(
                  iso,
                  visualRole,
                  name,
                  findWeekAndDay,
                  visualRole === 'REF' ? (block as any) || 'base' : undefined
                );
                const offHeader = !workedThisBlockHeader;
                const headerCellClasses = offHeader 
                  ? 'bg-orange-900/20 border-orange-800/30' 
                  : '';
                
                return (
                  <Td key={`head_${pKey}_${block || 'base'}_${iso}`} className={headerCellClasses}> </Td>
                );
              })}
            </tr>

            {!collapsed[pKey] &&
              CONCEPTS.map(concepto => (
                <tr key={`${pKey}_${block || 'base'}_${concepto}`} id={`person-${pKey}-rows`}>
                  <Td className='whitespace-nowrap align-middle'>
                    <div className='text-xs text-zinc-300'>{concepto}</div>
                  </Td>

                  {semana.map(fecha => {
                    const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
                    const workedThisBlock = isPersonScheduledOnBlock(
                      fecha,
                      visualRole,
                      name,
                      findWeekAndDay,
                      visualRole === 'REF' ? (block as any) || 'base' : undefined
                    );
                    const off = !workedThisBlock;
                    
                    // Clases condicionales para celdas cuando no trabaja
                    const cellClasses = off 
                      ? 'bg-orange-900/20 border-orange-800/30' 
                      : '';

                    if (concepto === 'Dietas') {
                      const parsed = parseDietas(val);
                      return (
                        <Td key={`${pKey}_${concepto}_${fecha}`} className={cellClasses}>
                          <div className='flex flex-col gap-2'>
                            <select
                              className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                              defaultValue=''
                              onChange={e => {
                                const v = (e.target as HTMLSelectElement).value;
                                if (!v) return;
                                const items = new Set(parsed.items);
                                items.add(v);
                                const newStr = formatDietas(
                                  items,
                                  items.has('Ticket') ? parsed.ticket : null
                                );
                                setCell(pKey, concepto, fecha, newStr);
                                (e.target as HTMLSelectElement).value = '';
                              }}
                            >
                              <option value=''>
                              </option>
                              {dietasOptions.map(opt => (
                                <option key={opt as string} value={opt as string}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <div className='flex flex-wrap gap-2'>
                              {Array.from(parsed.items)
                                .filter(it => it !== 'Ticket')
                                .map(it => (
                                  <span
                                    key={it}
                                    className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
                                    title={it}
                                  >
                                    <span className='text-xs text-zinc-200'>
                                      {it}
                                    </span>
                                    <button
                                      type='button'
                                      className='text-zinc-400 hover:text-red-500 text-xs'
                                      onClick={() => {
                                        const items = new Set(parsed.items);
                                        items.delete(it);
                                        const newStr = formatDietas(
                                          items,
                                          items.has('Ticket')
                                            ? parsed.ticket
                                            : null
                                        );
                                        setCell(pKey, concepto, fecha, newStr);
                                      }}
                                      title='Quitar'
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}

                              {parsed.items.has('Ticket') && (
                                <span
                                  className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
                                  title='Ticket'
                                >
                                  <span className='text-xs text-zinc-200'>
                                    Ticket
                                  </span>
                                  <input
                                    type='number'
                                    min='0'
                                    step='0.01'
                                    placeholder='€'
                                    className='w-24 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                                    value={parsed.ticket ?? ''}
                                    onChange={e => {
                                      const n =
                                        (e.target as HTMLInputElement).value === ''
                                          ? null
                                          : Number((e.target as HTMLInputElement).value);
                                      const newStr = formatDietas(
                                        parsed.items,
                                        n
                                      );
                                      setCell(pKey, concepto, fecha, newStr);
                                    }}
                                    title='Importe Ticket'
                                  />
                                  <button
                                    type='button'
                                    className='text-zinc-400 hover:text-red-500 text-xs'
                                    onClick={() => {
                                      const items = new Set(parsed.items);
                                      items.delete('Ticket');
                                      const newStr = formatDietas(items, null);
                                      setCell(pKey, concepto, fecha, newStr);
                                    }}
                                    title='Quitar Ticket'
                                  >
                                    ×
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                        </Td>
                      );
                    }

                    if (
                      concepto === 'Transporte' ||
                      concepto === 'Nocturnidad' ||
                      concepto === 'Penalty lunch'
                    ) {
                      return (
                        <Td key={`${pKey}_${concepto}_${fecha}`} className={cellClasses}>
                          <select
                            className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                            value={val}
                            onChange={e =>
                              setCell(pKey, concepto, fecha, (e.target as HTMLSelectElement).value)
                            }
                            disabled={off}
                          >
                            {SI_NO.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </Td>
                      );
                    }

                    const numericProps =
                      concepto === 'Kilometraje'
                        ? {
                            type: 'number' as const,
                            min: '0',
                            step: '0.1',
                            placeholder: '',
                          }
                        : {
                            type: 'number' as const,
                            min: '0',
                            step: '1',
                            placeholder: '',
                          };

                    return (
                      <Td key={`${pKey}_${concepto}_${fecha}`} className={cellClasses}>
                        <input
                          {...numericProps}
                          className='w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
                          value={val}
                          onChange={e =>
                            setCell(pKey, concepto, fecha, (e.target as HTMLInputElement).value)
                          }
                          disabled={off}
                        />
                      </Td>
                    );
                  })}
                </tr>
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default React.memo(ReportPersonRows);
