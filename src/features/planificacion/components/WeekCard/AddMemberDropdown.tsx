import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';

type AddMemberDropdownProps = {
  scope: 'pre' | 'pro';
  weekId: string;
  dayIndex: number;
  day: AnyRecord;
  dropdownKey: string;
  dropdownState: { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };
  setDropdownState: (key: string, updates: Partial<{ isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean }>) => void;
  addMemberTo: (scope: 'pre' | 'pro', weekId: string, dayIdx: number, listKey: 'team' | 'prelight' | 'pickup', member: AnyRecord) => void;
  options: AnyRecord[];
  theme: 'dark' | 'light';
  focusColor: string;
  readOnly?: boolean;
};

export function AddMemberDropdown({
  scope,
  weekId,
  dayIndex,
  day,
  dropdownKey,
  dropdownState,
  setDropdownState,
  addMemberTo,
  options,
  theme,
  focusColor,
  readOnly = false,
}: AddMemberDropdownProps) {
  // Verificar primero si debemos renderizar (ANTES de todos los hooks)
  if (day.tipo === 'Descanso' || day.tipo === 'Fin') {
    return null;
  }

  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownState(dropdownKey, { isOpen: false });
        setSearchQuery('');
      }
    };

    if (dropdownState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Enfocar el input de búsqueda cuando se abre el dropdown
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownState.isOpen, dropdownKey, setDropdownState]);

  // Filtrar opciones basándose en la búsqueda
  const filteredOptions = options.filter((p: AnyRecord) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const role = (p.role || '').toLowerCase();
    return name.includes(query) || role.includes(query);
  });

  return (
    <div className='no-pdf w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        disabled={readOnly}
        className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left transition-colors ${
          readOnly ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          theme === 'light' 
            ? 'bg-white text-gray-900' 
            : 'bg-black/40 text-zinc-300'
        }`}
        style={{
          borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: dropdownState.isButtonHovered && theme === 'light' 
            ? '#0476D9' 
            : (dropdownState.isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          paddingRight: '1.5rem',
        }}
      >
        {t('planning.addMember')}
      </button>
      {dropdownState.isOpen && (
        <div className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-hidden flex flex-col max-h-48 sm:max-h-56 md:max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {/* Campo de búsqueda */}
          <div className='p-1.5 sm:p-2 border-b border-neutral-border'>
            <input
              ref={searchInputRef}
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Buscar...'
              className={`w-full px-2 py-1 text-[9px] sm:text-[10px] md:text-xs lg:text-sm rounded border focus:outline-none ${
                theme === 'light'
                  ? 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
                  : 'bg-black/40 text-zinc-300 border-zinc-600 focus:border-zinc-400'
              }`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {/* Lista de opciones con scroll */}
          <div className='overflow-y-auto flex-1'>
            {filteredOptions.length === 0 ? (
              <div className={`px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2.5 text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-center ${
                theme === 'light' ? 'text-gray-500' : 'text-zinc-400'
              }`}>
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((p: AnyRecord, ii: number) => (
            <button
              key={`${p.role}-${p.name}-${ii}`}
              type='button'
              onClick={() => {
                if (readOnly) return;
                const [role, name] = `${p.role}::${p.name}`.split('::');
                addMemberTo(scope, weekId, dayIndex, 'team', {
                  role,
                  name,
                });
                setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
                setSearchQuery('');
              }}
              disabled={readOnly}
              onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: `${p.role}::${p.name}` })}
              onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
              className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
                theme === 'light' 
                  ? 'text-gray-900' 
                  : 'text-zinc-300'
              }`}
              style={{
                backgroundColor: dropdownState.hoveredOption === `${p.role}::${p.name}` 
                  ? (theme === 'light' ? '#A0D3F2' : focusColor)
                  : 'transparent',
                color: dropdownState.hoveredOption === `${p.role}::${p.name}` 
                  ? (theme === 'light' ? '#111827' : 'white')
                  : 'inherit',
              }}
            >
              {p.role} · {p.name}
            </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

