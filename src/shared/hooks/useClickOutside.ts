import { useEffect, RefObject } from 'react';

/**
 * Hook para detectar clics fuera de un elemento
 * @param ref Referencia al elemento que no debe cerrarse al hacer clic fuera
 * @param handler Función a ejecutar cuando se hace clic fuera
 * @param enabled Si está habilitado (por defecto true)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}

/**
 * Hook para detectar clics fuera de múltiples elementos
 * @param refs Array de referencias a elementos que no deben cerrarse al hacer clic fuera
 * @param handler Función a ejecutar cuando se hace clic fuera de todos los elementos
 * @param enabled Si está habilitado (por defecto true)
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: Array<RefObject<T>>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const isOutside = refs.every(
        ref => !ref.current || !ref.current.contains(event.target as Node)
      );
      
      if (isOutside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [refs, handler, enabled]);
}

