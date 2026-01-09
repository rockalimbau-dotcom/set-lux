import React from 'react';

interface DietasDropdownProps {
  isOpen: boolean;
  theme: 'dark' | 'light';
  focusColor: string;
  dietasOptions: string[];
  dropdownState: { hoveredOption: string | null };
  onSelectOption: (option: string) => void;
  onHoverOption: (option: string | null) => void;
}

export function DietasDropdown({
  isOpen,
  theme,
  focusColor,
  dietasOptions,
  dropdownState,
  onSelectOption,
  onHoverOption,
}: DietasDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-40 sm:max-h-48 md:max-h-60 ${
      theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
    }`}>
      {dietasOptions.map(opt => (
        <button
          key={opt as string}
          type='button'
          onClick={() => onSelectOption(opt as string)}
          onMouseEnter={() => onHoverOption(opt as string)}
          onMouseLeave={() => onHoverOption(null)}
          className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
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
  );
}

