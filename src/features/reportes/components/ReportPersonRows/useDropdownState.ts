import { useState } from 'react';

interface DropdownState {
  isOpen: boolean;
  hoveredOption: string | null;
  isButtonHovered: boolean;
}

/**
 * Hook to manage dropdown states
 */
export function useDropdownState() {
  const [dropdownStates, setDropdownStates] = useState<Record<string, DropdownState>>({});

  const getDropdownState = (key: string): DropdownState => {
    return dropdownStates[key] || { isOpen: false, hoveredOption: null, isButtonHovered: false };
  };

  const setDropdownState = (key: string, updates: Partial<DropdownState>) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: { ...getDropdownState(key), ...updates }
    }));
  };

  return { getDropdownState, setDropdownState };
}

