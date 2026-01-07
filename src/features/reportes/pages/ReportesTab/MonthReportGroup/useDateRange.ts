import { useMemo, useEffect } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD, toYYYYMMDD, addDays } from '@shared/utils/date';
import { AnyRecord } from '@shared/types/common';

interface UseDateRangeParams {
  weeks: AnyRecord[];
  weekToSemanasISO: (week: AnyRecord) => string[];
  project?: { id?: string; nombre?: string };
  mode: 'semanal' | 'mensual' | 'publicidad';
  monthKey: string;
  allMonthKeys: string[];
}

/**
 * Hook para gestionar el rango de fechas con sincronización entre meses
 */
export function useDateRange({
  weeks,
  weekToSemanasISO,
  project,
  mode,
  monthKey,
  allMonthKeys,
}: UseDateRangeParams) {
  // Calcular rango de fechas por defecto (primera y última fecha del mes)
  const defaultDateRange = useMemo(() => {
    if (weeks.length === 0) return { from: '', to: '' };
    const allDates: string[] = [];
    weeks.forEach(week => {
      allDates.push(...weekToSemanasISO(week));
    });
    allDates.sort();
    return { from: allDates[0] || '', to: allDates[allDates.length - 1] || '' };
  }, [weeks, weekToSemanasISO]);

  // Clave única para persistir las fechas de cada mes
  const dateRangeKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_dateRange_${base}_${mode}_${monthKey}`;
  }, [project?.id, project?.nombre, mode, monthKey]);

  // Usar useLocalStorage para persistir las fechas, inicializando con valores por defecto si no existen
  const defaultFrom = defaultDateRange.from || '';
  const defaultTo = defaultDateRange.to || '';
  const [dateFrom, setDateFrom] = useLocalStorage<string>(`${dateRangeKey}_from`, defaultFrom);
  const [dateTo, setDateTo] = useLocalStorage<string>(`${dateRangeKey}_to`, defaultTo);

  // Actualizar fechas si los valores por defecto cambian y las fechas actuales están vacías
  useEffect(() => {
    const keyFrom = `${dateRangeKey}_from`;
    const keyTo = `${dateRangeKey}_to`;
    const storedFrom = storage.getString(keyFrom);
    const storedTo = storage.getString(keyTo);

    // Si hay valores por defecto y no están en localStorage, guardarlos
    if (defaultFrom && !storedFrom) {
      setDateFrom(defaultFrom);
    }
    if (defaultTo && !storedTo) {
      setDateTo(defaultTo);
    }
  }, [defaultFrom, defaultTo, dateFrom, dateTo, setDateFrom, setDateTo, dateRangeKey]);

  // Escuchar cambios en localStorage desde otros componentes (mes anterior)
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent) => {
      const changedKey = e.detail?.key;
      const currentFromKey = `${dateRangeKey}_from`;

      if (changedKey === currentFromKey) {
        // Forzar actualización leyendo directamente del localStorage
        const newValue = storage.getString(currentFromKey);
        if (newValue) {
          try {
            const parsed = JSON.parse(newValue);
            if (parsed !== dateFrom) {
              setDateFrom(parsed);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [dateRangeKey, dateFrom, setDateFrom, monthKey]);

  // Cuando cambia "Hasta", actualizar automáticamente "Desde" del mes siguiente
  useEffect(() => {
    if (!dateTo) return;

    // Calcular el día siguiente
    const currentDate = parseYYYYMMDD(dateTo);
    const nextDate = addDays(currentDate, 1);
    const nextDateISO = toYYYYMMDD(nextDate);

    // Encontrar el mes siguiente
    const currentIndex = allMonthKeys.indexOf(monthKey);
    if (currentIndex === -1 || currentIndex === allMonthKeys.length - 1) {
      return; // No hay mes siguiente
    }

    const nextMonthKey = allMonthKeys[currentIndex + 1];

    // Actualizar "Desde" del mes siguiente con el día siguiente (sin verificar el mes)
    const base = project?.id || project?.nombre || 'tmp';
    const nextDateRangeKey = `reportes_dateRange_${base}_${mode}_${nextMonthKey}_from`;

    // Guardar en localStorage usando el servicio
    storage.setString(nextDateRangeKey, JSON.stringify(nextDateISO));

    // Disparar un evento personalizado para notificar a otros componentes
    window.dispatchEvent(
      new CustomEvent('localStorageChange', {
        detail: { key: nextDateRangeKey, value: nextDateISO },
      })
    );
  }, [dateTo, monthKey, allMonthKeys, project?.id, project?.nombre, mode]);

  return { dateFrom, setDateFrom, dateTo, setDateTo, dateRangeKey };
}

