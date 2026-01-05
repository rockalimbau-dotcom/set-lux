import { useMemo } from 'react';
import { parseYYYYMMDD } from '@shared/utils/date';
import { weekISOdays } from '../../utils/plan';
import { filterWeeksByDateRange } from './MonthSectionUtils';

interface UseFilteredDataProps {
  projectMode: 'semanal' | 'mensual' | 'publicidad';
  dateFrom: string;
  dateTo: string;
  project?: any;
  weeksForMonth: any[];
  allWeeks: any[];
  aggregateFilteredConcepts?: (
    project: any,
    weeks: any[],
    filterISO: ((iso: string) => boolean) | null,
    dateFrom: string | null,
    dateTo: string | null
  ) => Map<string, any> | null;
}

export function useFilteredData({
  projectMode,
  dateFrom,
  dateTo,
  project,
  weeksForMonth,
  allWeeks,
  aggregateFilteredConcepts,
}: UseFilteredDataProps) {
  // Obtener datos filtrados por fecha si hay fechas seleccionadas (solo para semanal y mensual)
  // Cuando hay fechas seleccionadas, necesitamos incluir semanas de otros meses si las fechas lo requieren
  const filteredData = useMemo(() => {
    if (
      (projectMode !== 'semanal' && projectMode !== 'mensual') ||
      !dateFrom ||
      !dateTo ||
      !project ||
      !aggregateFilteredConcepts
    ) {
      return null;
    }

    // Si hay fechas seleccionadas, buscar todas las semanas que contengan días dentro del rango
    // Esto incluye semanas de otros meses si las fechas lo requieren
    let weeksToUse = weeksForMonth;
    if (allWeeks && allWeeks.length > 0) {
      weeksToUse = filterWeeksByDateRange(allWeeks, dateFrom, dateTo);
    }

    // Cuando hay fechas seleccionadas, pasar null como filterISO para incluir todos los días del rango
    // independientemente del mes
    return aggregateFilteredConcepts(project, weeksToUse, null, dateFrom, dateTo);
  }, [
    projectMode,
    dateFrom,
    dateTo,
    project,
    weeksForMonth,
    allWeeks,
    aggregateFilteredConcepts,
  ]);

  return filteredData;
}

