import { useMemo } from 'react';
import { weekISOdays } from '../../utils/plan';
import { filterWeeksByDateRange } from './MonthSectionUtils';

/** ISO mínimo y máximo cubiertos por las semanas del mes en nómina (misma idea que el default en Reportes). */
function minMaxIsoFromWeeks(weeks: any[]): { min: string; max: string } | null {
  if (!Array.isArray(weeks) || weeks.length === 0) return null;
  const all: string[] = [];
  for (const w of weeks) {
    all.push(...weekISOdays(w));
  }
  if (all.length === 0) return null;
  all.sort();
  return { min: all[0], max: all[all.length - 1] };
}

interface UseFilteredDataProps {
  projectMode: 'semanal' | 'mensual' | 'diario';
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

    const df = String(dateFrom).trim();
    const dt = String(dateTo).trim();
    const span = minMaxIsoFromWeeks(weeksForMonth);
    // Rango "completo" respecto a las semanas de este bloque: el agregado filtrado duplica la base y ha mostrado totales distintos a Reportes (total semana / mismo storage).
    if (span && df === span.min && dt === span.max) {
      return null;
    }

    // Si hay fechas seleccionadas, buscar todas las semanas que contengan días dentro del rango
    // Esto incluye semanas de otros meses si las fechas lo requieren
    let weeksToUse = weeksForMonth;
    if (allWeeks && allWeeks.length > 0) {
      weeksToUse = filterWeeksByDateRange(allWeeks, df, dt);
    }

    // Cuando hay fechas seleccionadas, pasar null como filterISO para incluir todos los días del rango
    // independientemente del mes
    return aggregateFilteredConcepts(project, weeksToUse, null, df, dt);
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

