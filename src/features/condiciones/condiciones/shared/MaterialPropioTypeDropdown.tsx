import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type MaterialPropioType = 'semanal' | 'diario';

interface DropdownState {
  isOpen: boolean;
  hoveredOption: string | null;
  isButtonHovered: boolean;
}

interface MaterialPropioTypeDropdownProps {
  value: MaterialPropioType;
  onChange: (val: MaterialPropioType) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

const MaterialPropioTypeDropdown: React.FC<MaterialPropioTypeDropdownProps> = ({
  value,
  onChange,
  readOnly = false,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    hoveredOption: null,
    isButtonHovered: false,
  });

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  const options: Array<{ value: MaterialPropioType; label: string }> = [
    { value: 'semanal', label: t('common.weekly') },
    { value: 'diario', label: t('common.advertising') },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownState(prev => ({ ...prev, isOpen: false, hoveredOption: null }));
      }
    };
    if (dropdownState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownState.isOpen]);

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

  const isDisabled = readOnly || disabled;

  return (
    <div className='w-full relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => !isDisabled && setDropdownState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        onMouseEnter={() => !isDisabled && setDropdownState(prev => ({ ...prev, isButtonHovered: true }))}
        onMouseLeave={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
        onBlur={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
        disabled={isDisabled}
        className={`w-full px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[8px] sm:text-[9px] md:text-[10px] text-left transition-colors ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'}`}
        style={{
          borderWidth: dropdownState.isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: dropdownState.isButtonHovered && theme === 'light'
            ? '#0476D9'
            : (dropdownState.isButtonHovered && theme === 'dark' ? '#fff' : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1.25 3.75h7.5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
          paddingRight: '1.5rem',
        }}
      >
        {options.find(opt => opt.value === value)?.label || '\u00A0'}
      </button>
      {dropdownState.isOpen && (
        <div
          className={`absolute top-full left-0 mt-0.5 sm:mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-48 sm:max-h-56 md:max-h-60 ${
            theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
          }`}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type='button'
              onClick={() => {
                if (isDisabled) return;
                onChange(opt.value);
                setDropdownState(prev => ({ ...prev, isOpen: false, hoveredOption: null }));
              }}
              disabled={isDisabled}
              onMouseEnter={() => setDropdownState(prev => ({ ...prev, hoveredOption: opt.value }))}
              onMouseLeave={() => setDropdownState(prev => ({ ...prev, hoveredOption: null }))}
              className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[8px] sm:text-[9px] md:text-[10px] transition-colors ${
                theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
              }`}
              style={{
                backgroundColor: dropdownState.hoveredOption === opt.value
                  ? (theme === 'light' ? '#A0D3F2' : focusColor)
                  : 'transparent',
                color: dropdownState.hoveredOption === opt.value
                  ? (theme === 'light' ? '#111827' : 'white')
                  : 'inherit',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialPropioTypeDropdown;
