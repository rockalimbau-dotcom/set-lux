import { useMemo } from 'react';

interface UseFilteredSemanaProps {
  safeSemana: string[];
  horarioTexto: (iso: string) => string;
  horarioPrelight: (iso: string) => string;
  horarioPickup: (iso: string) => string;
}

/**
 * Hook to filter semana based on schedule visibility
 */
export function useFilteredSemana({
  safeSemana,
  horarioTexto,
  horarioPrelight,
  horarioPickup,
}: UseFilteredSemanaProps): string[] {
  return useMemo(() => {
    return safeSemana;
  }, [safeSemana]);
}

