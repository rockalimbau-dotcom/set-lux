import React from 'react';
import { useDropdown } from './useDropdown';

interface DropdownSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  theme: 'dark' | 'light';
  focusColor: string;
  getDisplayName?: (value: string) => string;
}

/**
 * Reusable dropdown select component
 */
export function DropdownSelect({
  value,
  options,
  onChange,
  theme,
  focusColor,
  getDisplayName,
}: DropdownSelectProps) {
  const {
    isOpen,
    setIsOpen,
    hoveredOption,
    setHoveredOption,
    isButtonHovered,
    setIsButtonHovered,
    dropdownRef,
  } = useDropdown();

  const displayValue = getDisplayName ? getDisplayName(value) : value;

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        onBlur={() => setIsButtonHovered(false)}
        className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm text-left transition-colors ${
          theme === 'light' 
            ? 'bg-white text-gray-900' 
            : 'bg-black/40 text-zinc-300'
        }`}
        style={{
          borderWidth: isButtonHovered ? '1.5px' : '1px',
          borderStyle: 'solid',
          borderColor: isButtonHovered && theme === 'light' 
            ? '#0476D9' 
            : (isButtonHovered && theme === 'dark'
              ? '#fff'
              : 'var(--border)'),
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          paddingRight: '2rem',
        }}
      >
        {displayValue || '\u00A0'}
      </button>
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
          theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
        }`}>
          {options.map(opt => (
            <button
              key={opt}
              type='button'
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
                setHoveredOption(null);
              }}
              onMouseEnter={() => setHoveredOption(opt)}
              onMouseLeave={() => setHoveredOption(null)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                theme === 'light' 
                  ? 'text-gray-900' 
                  : 'text-zinc-300'
              }`}
              style={{
                backgroundColor: hoveredOption === opt 
                  ? (theme === 'light' ? '#A0D3F2' : focusColor)
                  : 'transparent',
                color: hoveredOption === opt 
                  ? (theme === 'light' ? '#111827' : 'white')
                  : 'inherit',
              }}
            >
              {getDisplayName ? getDisplayName(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

