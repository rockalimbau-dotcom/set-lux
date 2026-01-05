import { useEffect, RefObject } from 'react';

/**
 * Hook to handle clicks outside an element
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  isOpen: boolean,
  onClose: () => void
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, ref, onClose]);
}

