import { useMemo } from 'react';

interface UseColumnVisibilityProps {
  enriched: any[];
}

export function useColumnVisibility({ enriched }: UseColumnVisibilityProps) {
  const columnVisibility = useMemo(() => {
    const hasHolidays = enriched.some(r => r._holidays > 0);
    const hasTravel = enriched.some(r => r._travel > 0);
    const hasExtras = enriched.some(r => r.extras > 0);
    const hasTransporte = enriched.some(r => r.transporte > 0);
    const hasKm = enriched.some(r => r.km > 0);
    const hasDietas = enriched.some(r => r._totalDietas > 0);
    const hasMaterialPropio = enriched.some(
      r => (r._materialPropioDays || 0) > 0 || (r._materialPropioWeeks || 0) > 0 || (r._totalMaterialPropio || 0) > 0
    );

    return {
      holidays: hasHolidays,
      travel: hasTravel,
      extras: hasExtras,
      transporte: hasTransporte,
      km: hasKm,
      dietas: hasDietas,
      materialPropio: hasMaterialPropio,
    };
  }, [enriched]);

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
    return enriched.some(r => (r._worked || 0) > 0 || (r._totalDias || 0) > 0);
  }, [enriched]);

  return {
    columnVisibility,
    hasLocalizacionData,
    hasCargaDescargaData,
    hasWorkedDaysData,
  };
}

