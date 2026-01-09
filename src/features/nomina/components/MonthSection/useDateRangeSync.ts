import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '@shared/services/localStorage.service';

interface UseDateRangeSyncProps {
  project?: any;
  projectMode: 'semanal' | 'mensual' | 'diario';
  monthKey: string;
}

export function useDateRangeSync({
  project,
  projectMode,
  monthKey,
}: UseDateRangeSyncProps) {
  // Fechas para filtrar conceptos específicos (solo semanal y mensual)
  // Usar las mismas claves que reportes para sincronización
  const dateRangeKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'tmp';
    return `reportes_dateRange_${base}_${projectMode}_${monthKey}`;
  }, [project?.id, project?.nombre, projectMode, monthKey]);
  
  // Función simple para leer valores de localStorage (useLocalStorage guarda como JSON string)
  const readStorageValue = useCallback((key: string): string => {
    const stored = storage.getString(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  }, []);
  
  // Leer fechas directamente de localStorage (las mismas claves que usa Reportes)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const stored = storage.getString(`${dateRangeKey}_from`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  });
  
  const [dateTo, setDateTo] = useState<string>(() => {
    const stored = storage.getString(`${dateRangeKey}_to`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return '';
  });
  
  // Sincronizar con localStorage cuando cambia la clave
  useEffect(() => {
    const keyFrom = `${dateRangeKey}_from`;
    const keyTo = `${dateRangeKey}_to`;
    const storedFrom = readStorageValue(keyFrom);
    const storedTo = readStorageValue(keyTo);
    
    if (storedFrom) {
      setDateFrom(storedFrom);
    }
    if (storedTo) {
      setDateTo(storedTo);
    }
  }, [dateRangeKey, readStorageValue]);
  
  // Verificar periódicamente por si Reportes guarda las fechas después
  useEffect(() => {
    const interval = setInterval(() => {
      const keyFrom = `${dateRangeKey}_from`;
      const keyTo = `${dateRangeKey}_to`;
      const storedFrom = readStorageValue(keyFrom);
      const storedTo = readStorageValue(keyTo);
      
      if (storedFrom && storedFrom !== dateFrom) {
        setDateFrom(storedFrom);
      }
      if (storedTo && storedTo !== dateTo) {
        setDateTo(storedTo);
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [dateRangeKey, readStorageValue, dateFrom, dateTo]);
  
  // Guardar en localStorage cuando cambian (para persistencia si el usuario las modifica)
  useEffect(() => {
    if (dateFrom) {
      storage.setString(`${dateRangeKey}_from`, JSON.stringify(dateFrom));
    }
  }, [dateRangeKey, dateFrom]);
  
  useEffect(() => {
    if (dateTo) {
      storage.setString(`${dateRangeKey}_to`, JSON.stringify(dateTo));
    }
  }, [dateRangeKey, dateTo]);

  return {
    dateRangeKey,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  };
}

