import React, { useEffect, useRef } from 'react';
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
  const { t } = useTranslation();
  // Verificar primero si debemos renderizar (optimización)
  if (day.tipo === 'Descanso' || day.tipo === 'Fin') {
    return null;
  }

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className='no-pdf w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        disabled={readOnly}
        className={`w-full px-2 py-1 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          paddingRight: '2rem',
        }}
      >
        {t('planning.addMember')}
      </button>
      {dropdownState.isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {options.map((p: AnyRecord, ii: number) => (
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
              }}
              disabled={readOnly}
              onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: `${p.role}::${p.name}` })}
              onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
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
          ))}
        </div>
      )}
    </div>
  );
}

