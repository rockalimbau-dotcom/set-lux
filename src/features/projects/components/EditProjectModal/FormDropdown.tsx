import React from 'react';
import { ProjectFormField } from '../ProjectFormField';
import { DropdownState } from './EditProjectModalTypes';
import {
  getBorderStyles,
  getHoverBackgroundColor,
  getHoverTextColor,
  getFocusColor,
} from './EditProjectModalUtils';

interface DropdownOption {
  value: string;
  label: string;
}

interface FormDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  dropdownState: DropdownState;
  setDropdownState: React.Dispatch<React.SetStateAction<DropdownState>>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  t: (key: string) => string;
}

export function FormDropdown({
  label,
  value,
  options,
  onChange,
  theme,
  dropdownState,
  setDropdownState,
  dropdownRef,
  t,
}: FormDropdownProps) {
  const focusColor = getFocusColor(theme);

  return (
    <ProjectFormField label={label} theme={theme}>
      <div className='relative w-full' ref={dropdownRef}>
        <button
          type='button'
          onClick={() => setDropdownState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
          onMouseEnter={() => setDropdownState(prev => ({ ...prev, isButtonHovered: true }))}
          onMouseLeave={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
          onBlur={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
          className={`w-full px-4 py-3 rounded-xl border focus:outline-none text-sm text-left transition-colors ${
            theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'
          }`}
          style={{
            ...getBorderStyles(dropdownState.isButtonHovered, theme),
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          {value}
        </button>
        {dropdownState.isOpen && (
          <div
            className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
              theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
            }`}
          >
            {options.map(option => (
              <button
                key={option.value}
                type='button'
                onClick={() => {
                  onChange(option.value);
                  setDropdownState({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                }}
                onMouseEnter={() =>
                  setDropdownState(prev => ({ ...prev, hoveredOption: option.value }))
                }
                onMouseLeave={() =>
                  setDropdownState(prev => ({ ...prev, hoveredOption: null }))
                }
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
                }`}
                style={{
                  backgroundColor:
                    dropdownState.hoveredOption === option.value
                      ? getHoverBackgroundColor(theme, focusColor)
                      : 'transparent',
                  color: getHoverTextColor(
                    theme,
                    dropdownState.hoveredOption === option.value
                  ),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </ProjectFormField>
  );
}

