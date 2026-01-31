import { Td } from '@shared/components';
import { AnyRecord } from '@shared/types/common';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';

type JornadaRowProps = {
  label: string;
  weekId: string;
  weekObj: AnyRecord;
  jornadaKey: string;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  readOnly?: boolean;
  rowKey?: string;
  isSelected?: boolean;
  toggleRowSelection?: (rowKey: string) => void;
  showSelection?: boolean;
};

const JORNADA_OPTIONS = [
  'Localizar',
  'Oficina',
  'Carga',
  'Pruebas de cámara',
  'Rodaje',
  'Rodaje Festivo',
  'Travel Day',
  'Prelight',
  'Recogida',
  'Descarga',
  'Descanso',
  'Fin',
];

type DropdownState = { isOpen: boolean; hoveredOption: string | null; isButtonHovered: boolean };

type JornadaDropdownCellProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  dropdownKey: string;
  dropdownState: DropdownState;
  setDropdownState: (key: string, updates: Partial<DropdownState>) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  translateJornadaType: (value: string) => string;
};

function JornadaDropdownCell({
  value,
  onChange,
  readOnly,
  dropdownKey,
  dropdownState,
  setDropdownState,
  theme,
  focusColor,
  translateJornadaType,
}: JornadaDropdownCellProps) {
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
    <div className='w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !readOnly && setDropdownState(dropdownKey, { isOpen: !dropdownState.isOpen })}
        onMouseEnter={() => !readOnly && setDropdownState(dropdownKey, { isButtonHovered: true })}
        onMouseLeave={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        onBlur={() => setDropdownState(dropdownKey, { isButtonHovered: false })}
        disabled={readOnly}
        className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs text-left transition-colors ${
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
        {value ? translateJornadaType(value) : '\u00A0'}
      </button>
      {dropdownState.isOpen && (
        <div
          className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-48 sm:max-h-56 md:max-h-60 ${
            theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
          }`}
        >
          {JORNADA_OPTIONS.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => {
                if (readOnly) return;
                onChange(opt);
                setDropdownState(dropdownKey, { isOpen: false, hoveredOption: null });
              }}
              disabled={readOnly}
              onMouseEnter={() => setDropdownState(dropdownKey, { hoveredOption: opt })}
              onMouseLeave={() => setDropdownState(dropdownKey, { hoveredOption: null })}
              className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs transition-colors ${
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
              {translateJornadaType(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function JornadaRow({
  label,
  weekId,
  weekObj,
  jornadaKey,
  setCell,
  readOnly = false,
  rowKey,
  isSelected,
  toggleRowSelection,
  showSelection = true,
}: JornadaRowProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const [dropdownStates, setDropdownStates] = useState<Record<string, DropdownState>>({});
  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';

  const getDropdownState = (key: string) =>
    dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };

  const setDropdownState = (key: string, updates: Partial<DropdownState>) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates },
    }));
  };

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
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

  const translateJornadaType = (tipo: string): string => {
    const translateFn = (key: string, defaultValue?: string): string => {
      const translated = t(key);
      return translated === key && defaultValue ? defaultValue : translated;
    };
    return translateJornadaTypeUtil(tipo, translateFn);
  };
  const DAYS = [
    { idx: 0, key: 'mon', name: t('reports.dayNames.monday') },
    { idx: 1, key: 'tue', name: t('reports.dayNames.tuesday') },
    { idx: 2, key: 'wed', name: t('reports.dayNames.wednesday') },
    { idx: 3, key: 'thu', name: t('reports.dayNames.thursday') },
    { idx: 4, key: 'fri', name: t('reports.dayNames.friday') },
    { idx: 5, key: 'sat', name: t('reports.dayNames.saturday') },
    { idx: 6, key: 'sun', name: t('reports.dayNames.sunday') },
  ];

  return (
    <tr>
      {rowKey && toggleRowSelection && (
        <Td align='middle' className={`text-center w-6 sm:w-7 md:w-8 px-0.5 ${showSelection ? '' : 'bg-white/5'}`}>
          <div className='flex justify-center'>
            <input
              type='checkbox'
              checked={isSelected ?? true}
              onChange={() => !readOnly && toggleRowSelection(rowKey)}
              disabled={readOnly}
              title={readOnly ? t('conditions.projectClosed') : (isSelected ? t('needs.deselectForExport') : t('needs.selectForExport'))}
              className={`accent-blue-500 dark:accent-[#f59e0b] scale-90 transition ${
                readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${showSelection ? 'opacity-70 hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
          </div>
        </Td>
      )}
      <Td className='border border-neutral-border px-1 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 font-semibold bg-white/5 whitespace-normal break-words text-[9px] sm:text-[10px] md:text-xs lg:text-sm align-middle'>
        {label}
      </Td>
      {DAYS.map((d, i) => {
        const day: AnyRecord = (weekObj as AnyRecord).days?.[i] || {};
        const value = (day as AnyRecord)[jornadaKey] || '';
        const dropdownKey = `${weekId}_${jornadaKey}_${i}`;
        const dropdownState = getDropdownState(dropdownKey);
        return (
          <Td key={d.key} align='middle' className='text-center'>
            <JornadaDropdownCell
              value={value}
              onChange={(nextValue) => !readOnly && setCell(weekId, i, jornadaKey, nextValue)}
              readOnly={readOnly}
              dropdownKey={dropdownKey}
              dropdownState={dropdownState}
              setDropdownState={setDropdownState}
              theme={theme}
              focusColor={focusColor}
              translateJornadaType={translateJornadaType}
            />
          </Td>
        );
      })}
    </tr>
  );
}
