import { useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

interface UseRowSelectionProps {
  persistKey: string;
  enriched: any[];
}

export function useRowSelection({ persistKey, enriched }: UseRowSelectionProps) {
  const selectedRowsKey = `${persistKey}_selectedRows`;
  const [selectedRowsArray, setSelectedRowsArray] = useLocalStorage<string[]>(
    selectedRowsKey,
    []
  );

  // Convertir array a Set para uso interno
  const selectedRows = useMemo(() => new Set(selectedRowsArray), [selectedRowsArray]);

  // Inicializar todas las filas como seleccionadas solo si no hay selección guardada y hay filas
  // Usamos una referencia para saber si ya se inicializó una vez
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && selectedRowsArray.length === 0 && enriched.length > 0) {
      const allKeys = enriched.map(r => `${r.role}__${r.name}`);
      setSelectedRowsArray(allKeys);
      hasInitializedRef.current = true;
    } else if (enriched.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [enriched.length, selectedRowsArray.length, setSelectedRowsArray]);

  const toggleRowSelection = (personKey: string) => {
    setSelectedRowsArray(prev => {
      const prevSet = new Set(prev);
      if (prevSet.has(personKey)) {
        prevSet.delete(personKey);
      } else {
        prevSet.add(personKey);
      }
      return Array.from(prevSet);
    });
  };

  const isRowSelected = (personKey: string) => {
    return selectedRows.has(personKey);
  };

  return {
    selectedRows,
    toggleRowSelection,
    isRowSelected,
  };
}

