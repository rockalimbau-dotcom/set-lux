import { useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

interface UseColumnSelectionProps {
  persistKey: string;
  columnCount: number;
}

/**
 * Hook para gestionar la selección de columnas (días) en necesidades
 */
export function useColumnSelection({ persistKey, columnCount }: UseColumnSelectionProps) {
  const selectedColumnsKey = `${persistKey}_selectedColumns`;
  const [selectedColumnsArray, setSelectedColumnsArray] = useLocalStorage<number[]>(
    selectedColumnsKey,
    []
  );

  const columnKeys = useMemo(
    () => Array.from({ length: columnCount }).map((_, i) => i),
    [columnCount]
  );

  const selectedColumns = useMemo(
    () => new Set(selectedColumnsArray),
    [selectedColumnsArray]
  );

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && selectedColumnsArray.length === 0 && columnKeys.length > 0) {
      setSelectedColumnsArray([...columnKeys]);
      hasInitializedRef.current = true;
    } else if (columnKeys.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [columnKeys, selectedColumnsArray.length, setSelectedColumnsArray]);

  const toggleColumnSelection = (columnIdx: number) => {
    setSelectedColumnsArray(prev => {
      const prevSet = new Set(prev);
      if (prevSet.has(columnIdx)) {
        prevSet.delete(columnIdx);
      } else {
        prevSet.add(columnIdx);
      }
      return Array.from(prevSet);
    });
  };

  const setAllColumns = (selectAll: boolean) => {
    setSelectedColumnsArray(selectAll ? [...columnKeys] : []);
  };

  const isColumnSelected = (columnIdx: number) => selectedColumns.has(columnIdx);

  return {
    selectedColumns,
    toggleColumnSelection,
    setAllColumns,
    isColumnSelected,
    columnKeys,
  };
}
