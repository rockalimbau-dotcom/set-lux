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
  const knownRowKeysRef = useRef<string[]>([]);
  useEffect(() => {
    if (!hasInitializedRef.current && selectedRowsArray.length === 0 && rowKeys.length > 0) {
      setSelectedRowsArray([...rowKeys]);
      hasInitializedRef.current = true;
    } else if (rowKeys.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
    if (rowKeys.length > 0) {
      knownRowKeysRef.current = rowKeys;
    }
  }, [rowKeys.length, selectedRowsArray.length, setSelectedRowsArray, rowKeys]);

  // Si aparecen nuevas filas (p.ej. nuevas claves de exportación), añadirlas por defecto
  useEffect(() => {
    if (rowKeys.length === 0) return;
    const previousRowKeys = knownRowKeysRef.current;
    const newRowKeys = rowKeys.filter(key => !previousRowKeys.includes(key));
    const missingNewKeys = newRowKeys.filter(key => !selectedRowsArray.includes(key));
    knownRowKeysRef.current = rowKeys;
    if (missingNewKeys.length === 0) return;
    setSelectedRowsArray([...selectedRowsArray, ...missingNewKeys]);
  }, [rowKeys, selectedRowsArray, setSelectedRowsArray]);

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
