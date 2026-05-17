import { useMemo } from 'react';
import { supportsSextoDiaJornada } from '@shared/constants/jornadaTypes';

interface UseColumnVisibilityProps {
  enriched: any[];
  projectMode?: 'semanal' | 'mensual' | 'diario';
}

export function useColumnVisibility({ enriched, projectMode }: UseColumnVisibilityProps) {
  const columnVisibility = useMemo(() => {
    const showSextoDiaColumns = supportsSextoDiaJornada(projectMode);
    const hasDietasData = (row: any) =>
      (row?._totalDietas || 0) > 0 ||
      (row?.ticketTotal || 0) > 0 ||
      (row?.otherTotal || 0) > 0 ||
      (row?.dietasCount instanceof Map && row.dietasCount.size > 0);

    const hasHolidays = enriched.some(r => r._holidays > 0);
    const hasSextoDia = enriched.some(r => (r._sextoDia || 0) > 0 || (r._totalSextoDia || 0) > 0);
    const hasSextoDiaHalf = enriched.some(r => (r._sextoDiaHalf || 0) > 0 || (r._totalSextoDiaHalf || 0) > 0);
    const hasTravel = enriched.some(r => r._travel > 0);
    const hasExtras = enriched.some(r => r.extras > 0);
    const hasTransporte = enriched.some(r => r.transporte > 0);
    const hasKm = enriched.some(r => r.km > 0);
    const hasGasolina = enriched.some(r => (r.gasolina || 0) > 0 || (r._totalGasolina || 0) > 0);
    const hasDietas = enriched.some(hasDietasData);
    // Solo si hay importe: los reportes pueden seguir marcando «Sí» en celdas antiguas; si en condiciones
    // quitaste material propio o precio 0, el total es 0 y no debe mostrarse la columna.
    const hasMaterialPropio = enriched.some(r => (r._totalMaterialPropio || 0) > 0);

    return {
      holidays: hasHolidays,
      sextoDia: showSextoDiaColumns && hasSextoDia,
      sextoDiaHalf: showSextoDiaColumns && hasSextoDiaHalf,
      travel: hasTravel,
      extras: hasExtras,
      transporte: hasTransporte,
      km: hasKm,
      gasolina: hasGasolina,
      dietas: hasDietas,
      materialPropio: hasMaterialPropio,
    };
  }, [enriched, projectMode]);

  // Verificar si hay datos de localización o carga/descarga para mostrar columnas solo cuando haya datos
  const hasLocalizacionData = useMemo(() => {
    return enriched.some(r => (r._localizarDays || 0) > 0 || (r._totalLocalizacion || 0) > 0);
  }, [enriched]);

  const hasCargaDescargaData = useMemo(() => {
    return enriched.some(
      r =>
        (r._cargaDays || 0) > 0 ||
        (r._descargaDays || 0) > 0 ||
        (r._totalCargaDescarga || 0) > 0
    );
  }, [enriched]);

  // Verificar si hay datos de días trabajados o total días para mostrar columnas solo cuando haya datos
  const hasWorkedDaysData = useMemo(() => {
    return enriched.some(r =>
      (r._worked || 0) > 0 ||
      (r._totalDias || 0) > 0
    );
  }, [enriched]);

  const hasHalfDaysData = useMemo(() => {
    return enriched.some(r =>
      (r._halfDays || 0) > 0 ||
      (r._totalHalfDays || 0) > 0
    );
  }, [enriched]);

  return {
    columnVisibility,
    hasLocalizacionData,
    hasCargaDescargaData,
    hasWorkedDaysData,
    hasHalfDaysData,
  };
}
