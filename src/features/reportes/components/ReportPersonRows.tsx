import React, { useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Td } from '@shared/components';
import { ROLE_COLORS } from '../../../shared/constants/roles';
import { personaKey as buildPersonaKey } from '../utils/model';
import { extractNumericValue, formatHorasExtraDecimal } from '../utils/runtime';
import { useTranslation } from 'react-i18next';

// Lightweight type aliases
type AnyRecord = Record<string, any>;

// Componente para la celda de Dietas (con hooks propios)
type DietasCellProps = {
  pKey: string;
  concepto: string;
  fecha: string;
  val: string;
  cellClasses: string;
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly: boolean;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  parseDietas: (raw: string) => { items: Set<string>; ticket: number | null };
  formatDietas: (items: Set<string>, ticket: number | null) => string;
  dietasOptions: string[];
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
};

const DietasCell: React.FC<DietasCellProps> = ({
  pKey,
  concepto,
  fecha,
  val,
  cellClasses,
  theme,
  focusColor,
  readOnly,
  dropdownKey,
  dropdownState,
  setDropdownState,
  parseDietas,
  formatDietas,
  dietasOptions,
  setCell,
}) => {
  const { t } = useTranslation();
  
  // Helper function to translate diet item names
  const translateDietItem = (item: string): string => {
    const itemMap: Record<string, string> = {
      'Comida': t('reports.dietOptions.lunch'),
      'Cena': t('reports.dietOptions.dinner'),
      'Desayuno': t('reports.dietOptions.breakfast'),
      'Dieta sin pernoctar': t('reports.dietOptions.dietNoOvernight'),
      'Dieta completa + desayuno': t('reports.dietOptions.dietFullBreakfast'),
      'Gastos de bolsillo': t('reports.dietOptions.pocketExpenses'),
      'Ticket': t('reports.dietOptions.ticket'),
    };
    return itemMap[item] || item;
  };
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [modalTheme, setModalTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownState(dropdownKey, { isOpen: false });
      }
    };

    if (dropdownState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownState.isOpen, dropdownKey, setDropdownState]);

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setModalTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const parsed = parseDietas(val);

  const handleRemoveItem = (item: string) => {
    if (readOnly) return;
    // Recalcular parsed para obtener los valores actuales
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete(item);
    const newStr = formatDietas(
      items,
      items.has('Ticket') ? currentParsed.ticket : null
    );
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const handleRemoveTicket = () => {
    if (readOnly) return;
    // Recalcular parsed para obtener los valores actuales
    const currentParsed = parseDietas(val);
    const items = new Set(currentParsed.items);
    items.delete('Ticket');
    const newStr = formatDietas(items, null);
    setCell(pKey, concepto, fecha, newStr);
    setItemToRemove(null);
  };

  const isLight = modalTheme === 'light';

  return (
    <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
      <div className='flex flex-col gap-2 items-center justify-center'>
        <div className='w-full relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
            onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
            onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
            className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
              theme === 'light' 
                ? 'bg-white text-gray-900' 
                : 'bg-black/40 text-zinc-300'
            } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.selectDiet')}
            style={{
              borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
              borderStyle: 'solid',
              borderColor: dropdownState.isButtonHovered && theme === 'light' 
                ? '#0476D9' 
                : (dropdownState.isButtonHovered && theme === 'dark'
                  ? '#fff'
                  : 'var(--border)'),
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '2rem',
            }}
          >
            &nbsp;
          </button>
          {dropdownState.isOpen && !readOnly && (
            <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
              theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
            }`}>
              {dietasOptions.map(opt => (
                <button
                  key={opt as string}
                  type='button'
                  onClick={() => {
                    if (readOnly) return;
                    const items = new Set(parsed.items);
                    items.add(opt as string);
                    const newStr = formatDietas(
                      items,
                      items.has('Ticket') ? parsed.ticket : null
                    );
                    setCell(pKey, concepto, fecha, newStr);
                    setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
                  }}
                  disabled={readOnly}
                  onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: opt as string })}
                  onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    theme === 'light' 
                      ? 'text-gray-900' 
                      : 'text-zinc-300'
                  }`}
                  style={{
                    backgroundColor: dropdownState.hoveredOption === opt 
                      ? (theme === 'light' ? '#A0D3F2' : focusColor)
                      : 'transparent',
                    color: dropdownState.hoveredOption === opt 
                      ? (theme === 'light' ? '#111827' : 'white')
                      : 'inherit',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-wrap gap-2 justify-center'>
          {Array.from(parsed.items)
            .filter(it => it !== 'Ticket')
            .map(it => (
              <span
                key={it}
                className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
                title={it}
              >
                <span className='text-xs text-zinc-200'>
                  {translateDietItem(it)}
                </span>
                <button
                  type='button'
                  className={`text-zinc-400 hover:text-red-500 text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (readOnly) return;
                    setItemToRemove(it);
                  }}
                  disabled={readOnly}
                  title={readOnly ? t('conditions.projectClosed') : t('reports.remove')}
                >
                  ×
                </button>
              </span>
            ))}

          {parsed.items.has('Ticket') && (
            <span
              className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'
              title={t('reports.dietOptions.ticket')}
            >
              <span className='text-xs text-zinc-200'>
                {t('reports.dietOptions.ticket')}
              </span>
              <input
                type='number'
                min='0'
                step='0.01'
                placeholder='€'
                className={`w-24 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={parsed.ticket ?? ''}
                onChange={e => {
                  if (readOnly) return;
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
                disabled={readOnly}
                readOnly={readOnly}
                title={readOnly ? t('conditions.projectClosed') : t('reports.ticketAmount')}
              />
              <button
                type='button'
                className={`text-zinc-400 hover:text-red-500 text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (readOnly) return;
                  setItemToRemove('Ticket');
                }}
                disabled={readOnly}
                title={readOnly ? t('conditions.projectClosed') : t('reports.removeTicket')}
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
      {itemToRemove && typeof document !== 'undefined' && createPortal(
        <div className='fixed inset-0 bg-black/60 grid place-items-center p-4 z-50'>
          <div 
            className='w-full max-w-md rounded-2xl border border-neutral-border p-6'
            style={{
              backgroundColor: isLight ? '#ffffff' : 'var(--panel)'
            }}
          >
            <h3 
              className='text-lg font-semibold mb-4' 
              style={{
                color: isLight ? '#0476D9' : '#F27405'
              }}
            >
              Confirmar eliminación
            </h3>
            
            <p 
              className='text-sm mb-6' 
              style={{color: isLight ? '#111827' : '#d1d5db'}}
            >
              ¿Estás seguro de eliminar <strong>{itemToRemove}</strong>?
            </p>

            <div className='flex justify-center gap-3'>
              <button
                onClick={() => setItemToRemove(null)}
                className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
                  color: isLight ? '#111827' : '#d1d5db'
                }}
                type='button'
              >
                {t('common.no')}
              </button>
              <button
                onClick={() => {
                  if (itemToRemove === 'Ticket') {
                    handleRemoveTicket();
                  } else {
                    handleRemoveItem(itemToRemove);
                  }
                }}
                className='px-3 py-2 rounded-lg border transition text-sm font-medium hover:border-[var(--hover-border)]'
                style={{
                  borderColor: isLight ? '#F27405' : '#F27405',
                  color: isLight ? '#F27405' : '#F27405',
                  backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)'
                }}
                type='button'
              >
                Sí
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Td>
  );
};

// Componente para la celda de SI/NO (Transporte, Nocturnidad, Penalty lunch) - ahora con checkbox
type SiNoCellProps = {
  pKey: string;
  concepto: string;
  fecha: string;
  val: string;
  cellClasses: string;
  readOnly: boolean;
  off: boolean;
  setCell: (pKey: string, concepto: string, fecha: string, value: any) => void;
};

const SiNoCell: React.FC<SiNoCellProps> = ({
  pKey,
  concepto,
  fecha,
  val,
  cellClasses,
  readOnly,
  off,
  setCell,
}) => {
  const { t } = useTranslation();
  // Determinar si el checkbox está checked basándose en si el valor es "Sí", "SI" o "SÍ"
  const isChecked = val && (val.toString().trim().toLowerCase() === 'sí' || val.toString().trim().toLowerCase() === 'si');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || off) return;
    // Si está checked, poner "Sí" (traducido), si no, poner vacío
    // Guardamos en español para compatibilidad con el backend, pero mostramos traducido
    setCell(pKey, concepto, fecha, e.target.checked ? 'Sí' : '');
  };

  return (
    <Td key={`${pKey}_${concepto}_${fecha}`} className={`text-center ${cellClasses}`} align='center'>
      <div className='w-full flex justify-center items-center'>
        <input
          type='checkbox'
          checked={isChecked}
          onChange={handleChange}
          disabled={off || readOnly}
          className={`accent-blue-500 dark:accent-[#f59e0b] ${off || readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={readOnly ? t('conditions.projectClosed') : (off ? t('reports.notWorkingThisDay') : (isChecked ? t('reports.uncheck') : t('reports.check')))}
        />
      </div>
    </Td>
  );
};

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
  readOnly?: boolean;
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
  readOnly = false,
}: Props) {
  const { t } = useTranslation();
  if (!Array.isArray(list)) return null;

  // Helper function to translate concept names
  const translateConcept = (concepto: string): string => {
    const conceptMap: Record<string, string> = {
      'Horas extra': t('reports.concepts.extraHours'),
      'Turn Around': t('reports.concepts.turnAround'),
      'Nocturnidad': t('reports.concepts.nightShift'),
      'Penalty lunch': t('reports.concepts.penaltyLunch'),
      'Dietas': t('reports.concepts.diets'),
      'Kilometraje': t('reports.concepts.mileage'),
      'Transporte': t('reports.concepts.transportation'),
    };
    return conceptMap[concepto] || concepto;
  };

  // Helper function to translate diet item names
  const translateDietItem = (item: string): string => {
    const itemMap: Record<string, string> = {
      'Comida': t('reports.dietOptions.lunch'),
      'Cena': t('reports.dietOptions.dinner'),
      'Desayuno': t('reports.dietOptions.breakfast'),
      'Dieta sin pernoctar': t('reports.dietOptions.dietNoOvernight'),
      'Dieta completa + desayuno': t('reports.dietOptions.dietFullBreakfast'),
      'Gastos de bolsillo': t('reports.dietOptions.pocketExpenses'),
      'Ticket': t('reports.dietOptions.ticket'),
    };
    return itemMap[item] || item;
  };

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
                    <div className='text-xs text-zinc-300'>{translateConcept(concepto)}</div>
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
                                <span className='text-zinc-200'>{translateDietItem(item)}</span>
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
