import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!dropdownState.isOpen) {
      setDropdownPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [dropdownState.isOpen]);

  return (
    <ProjectFormField label={label} theme={theme}>
      <div className='relative w-full' ref={dropdownRef}>
        <button
          ref={buttonRef}
          type='button'
          onClick={() => setDropdownState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
          onMouseEnter={() => setDropdownState(prev => ({ ...prev, isButtonHovered: true }))}
          onMouseLeave={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
          onBlur={() => setDropdownState(prev => ({ ...prev, isButtonHovered: false }))}
          className={`w-full px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-left transition-colors ${
            theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'
          }`}
          style={{
            ...getBorderStyles(dropdownState.isButtonHovered, theme),
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.375rem center',
            paddingRight: '1.5rem',
          }}
        >
          {value}
        </button>
        {dropdownState.isOpen && dropdownPosition && typeof document !== 'undefined'
          ? createPortal(
              <div
                className={`fixed border border-neutral-border rounded-lg shadow-xl z-[10000] overflow-y-auto max-h-60 ${
                  theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
                }`}
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                }}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
              >
                {options.map(option => (
                  <button
                    key={option.value}
                    type='button'
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(option.value);
                      setDropdownState({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                    }}
                    onMouseEnter={() =>
                      setDropdownState(prev => ({ ...prev, hoveredOption: option.value }))
                    }
                    onMouseLeave={() =>
                      setDropdownState(prev => ({ ...prev, hoveredOption: null }))
                    }
                    className={`w-full text-left px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-2 xl:px-4 xl:py-2 text-[10px] sm:text-[11px] md:text-xs lg:text-sm transition-colors ${
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
              </div>,
              document.body
            )
          : null}
      </div>
    </ProjectFormField>
  );
}
