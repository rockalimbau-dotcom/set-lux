import React, { useMemo, useRef, useEffect } from 'react';
import { Td } from '@shared/components';
import { ROLE_COLORS } from '../../../shared/constants/roles';
import { personaKey as buildPersonaKey } from '../utils/model';
import { extractNumericValue, formatHorasExtraDecimal } from '../utils/runtime';

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
  horasExtraTipo?: string;
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
  horasExtraTipo = 'Hora Extra - Normal',
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

  // Calcular offMap de forma estable, solo cuando cambien realmente los datos del plan
  // Usar useMemo con una comparación profunda de los elementos de list
  const offMap = useMemo(() => {
    const map = new Map<string, boolean>();
    list.forEach(p => {
      const visualRole = (p as AnyRecord)?.role || '';
      const name = (p as AnyRecord)?.name || '';
      semana.forEach(fecha => {
        try {
          const workedThisBlock = isPersonScheduledOnBlock(
            fecha,
            visualRole,
            name,
            findWeekAndDay,
            visualRole === 'REF' ? (block as any) || 'base' : undefined
          );
          const key = `${visualRole}_${name}_${fecha}_${block}`;
          map.set(key, !workedThisBlock);
        } catch (e) {
          // Si hay un error, asumir que no trabaja
          const key = `${visualRole}_${name}_${fecha}_${block}`;
          map.set(key, true);
        }
      });
    });
    return map;
    // IMPORTANTE: Comparar los elementos de list de forma profunda, no la referencia
    // Serializar solo los datos esenciales (role, name) y ordenarlos para comparación estable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Serializar y ordenar list para comparación estable
    JSON.stringify(
      list
        .map((p: AnyRecord) => ({ role: p?.role || '', name: p?.name || '' }))
        .sort((a, b) => {
          const aKey = `${a.role}_${a.name}`;
          const bKey = `${b.role}_${b.name}`;
          return aKey.localeCompare(bKey);
        })
    ),
    // Serializar semana para comparación estable
    JSON.stringify(semana),
    // block es primitivo, comparación directa
    block,
    // NO incluir: data, horasExtraTipo, findWeekAndDay, isPersonScheduledOnBlock
  ]);

  // Función para calcular el total de un concepto para una persona
  const calculateTotal = (pKey: string, concepto: string): number | string | { breakdown: Map<string, number> } => {
    if (concepto === 'Dietas') {
      // Para dietas, contar cada tipo de dieta por separado
      const breakdown = new Map<string, number>();
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && val.toString().trim() !== '') {
          const parsed = parseDietas(val);
          // Contar cada item (excepto Ticket que se maneja por separado)
          parsed.items.forEach(item => {
            if (item !== 'Ticket') {
              breakdown.set(item, (breakdown.get(item) || 0) + 1);
            }
          });
          // Si hay ticket, contarlo también
          if (parsed.ticket !== null) {
            breakdown.set('Ticket', (breakdown.get('Ticket') || 0) + 1);
          }
        }
      });
      return breakdown.size > 0 ? { breakdown } : '';
    }

    if (concepto === 'Transporte' || concepto === 'Nocturnidad' || concepto === 'Penalty lunch') {
      // Para conceptos SI/NO, contar cuántos "Sí" hay
      let count = 0;
      semana.forEach(fecha => {
        const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
        if (val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si')) {
          count++;
        }
      });
      return count > 0 ? count : '';
    }

    // Para conceptos numéricos, sumar todos los valores
    // Si es "Horas extra" y el tipo es de minutaje, extraer el valor decimal del formato
    const isHorasExtraFormatted = concepto === 'Horas extra' && 
      (horasExtraTipo === 'Hora Extra - Minutaje desde corte' || 
       horasExtraTipo === 'Hora Extra - Minutaje + Cortesía');
    
    let total = 0;
    semana.forEach(fecha => {
      const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
      if (val && val.toString().trim() !== '') {
        let num: number;
        if (isHorasExtraFormatted) {
          // Para formato decimal, extraer el valor numérico del formato "0.58 (35 ')"
          num = extractNumericValue(val);
        } else {
          // Para otros valores, usar Number directamente
          num = Number(val);
        }
        if (!isNaN(num)) {
          total += num;
        }
      }
    });
    
    // Si es horas extra con formato decimal, formatear el total
    if (isHorasExtraFormatted && total > 0) {
      return formatHorasExtraDecimal(total);
    }
    
    return total > 0 ? total : '';
  };

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
                // Usar el mapa memorizado para obtener off, evitando recálculos cuando cambia horasExtraTipo
                const key = `${visualRole}_${name}_${iso}_${block}`;
                const offHeader = offMap.get(key) ?? false;
                const headerCellClasses = offHeader 
                  ? 'bg-orange-900/20 border-orange-800/30' 
                  : '';
                
                return (
                  <Td key={`head_${pKey}_${block || 'base'}_${iso}`} className={headerCellClasses}> </Td>
                );
              })}
              <Td className='text-center'>&nbsp;</Td>
            </tr>

            {!collapsed[pKey] &&
              CONCEPTS.map(concepto => (
                <tr key={`${pKey}_${block || 'base'}_${concepto}`} id={`person-${pKey}-rows`}>
                  <Td className='whitespace-nowrap align-middle'>
                    <div className='text-xs text-zinc-300'>{concepto}</div>
                  </Td>

                  {semana.map(fecha => {
                    const val = data?.[pKey]?.[concepto]?.[fecha] ?? '';
                    // Usar el mapa memorizado para obtener off, evitando recálculos cuando cambia horasExtraTipo
                    const key = `${visualRole}_${name}_${fecha}_${block}`;
                    const off = offMap.get(key) ?? false;
                    
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

                    // Para "Horas extra" con formato decimal, usar type="text" para permitir valores formateados
                    const isHorasExtraFormatted = concepto === 'Horas extra' && 
                      (horasExtraTipo === 'Hora Extra - Minutaje desde corte' || 
                       horasExtraTipo === 'Hora Extra - Minutaje + Cortesía');
                    
                    const numericProps =
                      isHorasExtraFormatted
                        ? {
                            type: 'text' as const,
                            placeholder: '',
                          }
                        : concepto === 'Kilometraje'
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
                  <Td className='text-center align-middle whitespace-nowrap'>
                    {(() => {
                      const total = calculateTotal(pKey, concepto);
                      if (total === '') return '';
                      
                      // Si es dietas, mostrar desglose en píldoras
                      if (concepto === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
                        const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
                        if (breakdown.size === 0) return '';
                        
                        return (
                          <div className='flex flex-wrap gap-1 justify-center'>
                            {Array.from(breakdown.entries()).map(([item, count]) => (
                              <span
                                key={item}
                                className='inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-border bg-black/40 text-xs'
                              >
                                <span className='text-zinc-400'>x{count}</span>
                                <span className='text-zinc-200'>{item}</span>
                              </span>
                            ))}
                          </div>
                        );
                      }
                      
                      if (typeof total === 'number') {
                        // Para números, mostrar con formato (sin decimales si es entero)
                        return total % 1 === 0 ? total.toString() : total.toFixed(2);
                      }
                      return total.toString();
                    })()}
                  </Td>
                </tr>
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default React.memo(ReportPersonRows);
