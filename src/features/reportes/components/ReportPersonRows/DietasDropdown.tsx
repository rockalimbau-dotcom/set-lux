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
    <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
      theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
    }`}>
      {dietasOptions.map(opt => (
        <button
          key={opt as string}
          type='button'
          onClick={() => onSelectOption(opt as string)}
          onMouseEnter={() => onHoverOption(opt as string)}
          onMouseLeave={() => onHoverOption(null)}
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
  );
}

