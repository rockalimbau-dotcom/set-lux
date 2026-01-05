import React, { useMemo, useEffect, useState } from 'react';
import { Td } from '@shared/components';
import { ROLE_COLORS } from '@shared/constants/roles';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { ReportPersonRowsProps } from './ReportPersonRowsTypes';
import { translateConcept, translateDietItem, personaKeyFrom, calculateTotal } from './ReportPersonRowsHelpers';
import DietasCell from './DietasCell';
import SiNoCell from './SiNoCell';

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
  readOnly = false,
}: ReportPersonRowsProps) {
  const { t } = useTranslation();
  if (!Array.isArray(list)) return null;

  // Detectar el tema actual para el estilo de los selectores
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    // Observar cambios en el atributo data-theme
    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    window.addEventListener('themechange', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', updateTheme);
    };
  }, []);

  // Estados para los dropdowns personalizados
  const [dropdownStates, setDropdownStates] = useState<Record<string, {
    isOpen: boolean;
    hoveredOption: string | null;
    isButtonHovered: boolean;
  }>>({});

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';

  const getDropdownState = (key: string) => {
    return dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };
  };

  const setDropdownState = (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates }
    }));
  };

  const dietasOptions = useMemo(() => (DIETAS_OPCIONES.filter(Boolean) as string[]), [DIETAS_OPCIONES]);

  // Calcular offMap de forma estable, solo cuando cambien realmente los datos del plan
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

  return (
    <>
      {list.map(p => {
        const visualRole = (p as AnyRecord)?.role || '';
        const name = (p as AnyRecord)?.name || '';
        const pKey = personaKeyFrom(visualRole, name, block);

        const baseRoleForColor = (visualRole || '').replace(/[PR]$/, '');
        const col = (ROLE_COLORS as AnyRecord)[baseRoleForColor] || { bg: '#444', fg: '#fff' };

        return (
          <React.Fragment key={`${pKey}__${block || 'base'}`}>
            <tr>
              <Td className='whitespace-nowrap align-middle' scope='row'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      !readOnly && setCollapsed(c => ({ ...c, [pKey]: !c[pKey] }))
                    }
                    disabled={readOnly}
                    className={`w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={readOnly ? t('conditions.projectClosed') : (collapsed[pKey] ? t('reports.expand') : t('reports.collapse'))}
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
                  <Td key={`head_${pKey}_${block || 'base'}_${iso}`} className={`text-center ${headerCellClasses}`}> </Td>
                );
              })}
              <Td className='text-center'>&nbsp;</Td>
            </tr>

            {!collapsed[pKey] &&
              CONCEPTS.map(concepto => (
                <tr key={`${pKey}_${block || 'base'}_${concepto}`} id={`person-${pKey}-rows`}>
                  <Td className='whitespace-nowrap align-middle'>
                    <div className='text-xs text-zinc-300'>{translateConcept(concepto, t)}</div>
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
                      const dropdownKey = `dietas_${pKey}_${concepto}_${fecha}`;
                      const dropdownState = getDropdownState(dropdownKey);

                      return (
                        <DietasCell
                          key={`${pKey}_${concepto}_${fecha}`}
                          pKey={pKey}
                          concepto={concepto}
                          fecha={fecha}
                          val={val}
                          cellClasses={cellClasses}
                          theme={theme}
                          focusColor={focusColor}
                          readOnly={readOnly}
                          dropdownKey={dropdownKey}
                          dropdownState={dropdownState}
                          setDropdownState={setDropdownState}
                          parseDietas={parseDietas}
                          formatDietas={formatDietas}
                          dietasOptions={dietasOptions}
                          setCell={setCell}
                        />
                      );
                    }

                    if (
                      concepto === 'Transporte' ||
                      concepto === 'Nocturnidad' ||
                      concepto === 'Penalty lunch'
                    ) {
                      return (
                        <SiNoCell
                          key={`${pKey}_${concepto}_${fecha}`}
                          pKey={pKey}
                          concepto={concepto}
                          fecha={fecha}
                          val={val}
                          cellClasses={cellClasses}
                          readOnly={readOnly}
                          off={off}
                          setCell={setCell}
                        />
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
                      <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
                        <input
                          {...numericProps}
                          className={`w-full px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                          value={val}
                          onChange={e =>
                            !readOnly && setCell(pKey, concepto, fecha, (e.target as HTMLInputElement).value)
                          }
                          disabled={off || readOnly}
                          readOnly={readOnly}
                        />
                      </Td>
                    );
                  })}
                  <Td className='text-center align-middle whitespace-nowrap'>
                    {(() => {
                      const total = calculateTotal(pKey, concepto, semana, data, parseDietas, horasExtraTipo);
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
                                <span className='text-zinc-200'>{translateDietItem(item, t)}</span>
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
