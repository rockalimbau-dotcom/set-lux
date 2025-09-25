import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';

import { personaKey, personaRole, personaName } from '../utils/model';

interface Persona {
  [key: string]: any;
}

interface WeekAndDay {
  day: any;
}

interface ReportData {
  [personaKey: string]: {
    [concepto: string]: {
      [fecha: string]: string;
    };
  };
}

interface UseReportDataReturn {
  data: ReportData;
  setData: React.Dispatch<React.SetStateAction<ReportData>>;
  setCell: (pKey: string, concepto: string, fecha: string, valor: string) => void;
}

export default function useReportData(
  storageKey: string,
  safePersonas: Persona[],
  safeSemana: string[],
  CONCEPTS: string[],
  isPersonScheduledOn: (fecha: string, role: string, name: string, findWeekAndDay: (iso: string) => WeekAndDay) => boolean,
  findWeekAndDay: (iso: string) => WeekAndDay
): UseReportDataReturn {
  // Crear estado inicial basado en personas y conceptos
  const getInitialData = (): ReportData => {
    const base: ReportData = {};
    for (const p of safePersonas) {
      const key = personaKey(p);
      base[key] = {};
      for (const c of CONCEPTS) {
        base[key][c] = {};
        for (const f of safeSemana) base[key][c][f] = '';
      }
    }
    return base;
  };

  const [data, setData] = useLocalStorage(storageKey, getInitialData);

  // asegurar estructura si cambian semana/personas
  useEffect(() => {
    setData((prev: ReportData) => {
      const next = { ...(prev || {}) };
      for (const p of safePersonas) {
        const key = personaKey(p);
        next[key] = next[key] || {};
        for (const c of CONCEPTS) {
          next[key][c] = next[key][c] || {};
          for (const f of safeSemana) {
            if (!(f in next[key][c])) next[key][c][f] = '';
          }
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(safePersonas), JSON.stringify(safeSemana)]);

  // La persistencia se maneja automáticamente con useLocalStorage

  const setCell = (pKey: string, concepto: string, fecha: string, valor: string) => {
    setData((d: ReportData) => {
      const next = { ...d };
      next[pKey] = { ...(next[pKey] || {}) };
      next[pKey][concepto] = { ...(next[pKey][concepto] || {}) };
      next[pKey][concepto][fecha] = valor;
      return next;
    });

    if (concepto === 'Dietas' && valor !== '') {
      const who: { [key: string]: { role: string; name: string } } = {};
      for (const p of safePersonas) {
        const k = personaKey(p);
        who[k] = { role: personaRole(p), name: personaName(p) };
      }
      setData((prev: ReportData) => {
        const copy = { ...(prev || {}) };
        for (const p of safePersonas) {
          const k = personaKey(p);
          if (k === pKey) continue;
          const r = who[k]?.role || '';
          const n = who[k]?.name || '';
          if (isPersonScheduledOn(fecha, r, n, findWeekAndDay)) {
            copy[k] = { ...(copy[k] || {}) };
            copy[k]['Dietas'] = { ...(copy[k]['Dietas'] || {}) };
            copy[k]['Dietas'][fecha] = valor;
          }
        }
        return copy;
      });
    }
  };

  return { data, setData, setCell };
}
