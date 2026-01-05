import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Td } from '@shared/components';
import { useTranslation } from 'react-i18next';
import { DietasCellProps } from './ReportPersonRowsTypes';

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

export default DietasCell;
