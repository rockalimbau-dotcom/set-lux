import { useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

interface UseRowSelectionProps {
  persistKey: string;
  rowKeys: string[]; // Array de claves únicas para cada fila
}

/**
 * Hook para gestionar la selección de filas individuales en necesidades
 * Similar a useRowSelection de nómina
 */
export function useRowSelection({ persistKey, rowKeys }: UseRowSelectionProps) {
  const selectedRowsKey = `${persistKey}_selectedRows`;
  const [selectedRowsArray, setSelectedRowsArray] = useLocalStorage<string[]>(
    selectedRowsKey,
    []
  );

  // Convertir array a Set para uso interno
  const selectedRows = useMemo(() => new Set(selectedRowsArray), [selectedRowsArray]);

  // Inicializar todas las filas como seleccionadas solo si no hay selección guardada y hay filas
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && selectedRowsArray.length === 0 && rowKeys.length > 0) {
      setSelectedRowsArray([...rowKeys]);
      hasInitializedRef.current = true;
    } else if (rowKeys.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [rowKeys.length, selectedRowsArray.length, setSelectedRowsArray, rowKeys]);

  const toggleRowSelection = (rowKey: string) => {
    setSelectedRowsArray(prev => {
      const prevSet = new Set(prev);
      if (prevSet.has(rowKey)) {
        prevSet.delete(rowKey);
      } else {
        prevSet.add(rowKey);
      }
      return Array.from(prevSet);
    });
  };

  const selectRow = (rowKey: string) => {
    setSelectedRowsArray(prev => {
      if (prev.includes(rowKey)) return prev;
      return [...prev, rowKey];
    });
  };

  const isRowSelected = (rowKey: string) => {
    return selectedRows.has(rowKey);
  };

  return {
    selectedRows,
    toggleRowSelection,
    isRowSelected,
    selectRow,
  };
}
