import { useState, useCallback } from 'react';

interface SelectedDayForSwap {
  weekId: string;
  dayIdx: number;
}

/**
 * Hook para gestionar la selección de días para intercambio
 */
export function useColumnSwap() {
  const [selectedDay, setSelectedDay] = useState<SelectedDayForSwap | null>(null);

  const selectDayForSwap = useCallback((weekId: string, dayIdx: number) => {
    setSelectedDay({ weekId, dayIdx });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const isDaySelected = useCallback((weekId: string, dayIdx: number) => {
    return selectedDay?.weekId === weekId && selectedDay?.dayIdx === dayIdx;
  }, [selectedDay]);

  return {
    selectedDay,
    selectDayForSwap,
    clearSelection,
    isDaySelected,
  };
}
