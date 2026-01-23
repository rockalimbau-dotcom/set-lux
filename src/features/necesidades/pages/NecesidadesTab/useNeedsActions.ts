import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';

interface UseNeedsActionsProps {
  planKey: string;
  storageKey: string;
  readOnly: boolean;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook for needs actions (setCell, removeFromList, setWeekOpen)
 */
export function useNeedsActions({
  planKey,
  storageKey,
  readOnly,
  setNeeds,
}: UseNeedsActionsProps) {
  const { t } = useTranslation();

  const addCustomRow = useCallback((weekId: string): string | null => {
    if (readOnly) return null;
    const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newRow = {
      id: newId,
      label: t('needs.customRowLabel'),
      fieldKey: `custom_${newId}`,
    };
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || { days: {} };
      const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
      customRows.push(newRow);
      const next = {
        ...prev,
        [weekId]: {
          ...w,
          customRows,
        },
      };
      storage.setJSON(storageKey, next);
      return next;
    });
    return newId;
  }, [readOnly, setNeeds, t, storageKey]);

  const updateCustomRowLabel = useCallback((weekId: string, rowId: string, label: string) => {
    if (readOnly) return;
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || { days: {} };
      const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
      const nextRows = customRows.map(row =>
        row?.id === rowId ? { ...row, label } : row
      );
      const next = {
        ...prev,
        [weekId]: {
          ...w,
          customRows: nextRows,
        },
      };
      storage.setJSON(storageKey, next);
      return next;
    });
  }, [readOnly, setNeeds, storageKey]);

  const removeCustomRow = useCallback((weekId: string, rowId: string) => {
    if (readOnly) return;
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || { days: {} };
      const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
      const rowToRemove = customRows.find(row => row?.id === rowId);
      const nextRows = customRows.filter(row => row?.id !== rowId);
      const days = { ...(w.days || {}) } as AnyRecord;
      if (rowToRemove?.fieldKey) {
        for (let i = 0; i < 7; i++) {
          if (days[i]) {
            const day = { ...(days[i] as AnyRecord) };
            delete day[rowToRemove.fieldKey];
            days[i] = day;
          }
        }
      }
      const next = {
        ...prev,
        [weekId]: {
          ...w,
          days,
          customRows: nextRows,
        },
      };
      storage.setJSON(storageKey, next);
      return next;
    });
  }, [readOnly, setNeeds, storageKey]);

  const setCell = useCallback((weekId: string, dayIdx: number, fieldKey: string, value: unknown) => {
    if (readOnly) return;
    
    // Actualizar estado primero (más rápido)
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId] || { days: {} };
      const day: AnyRecord = (w.days && w.days[dayIdx]) || {};
      const next: AnyRecord = {
        ...prev,
        [weekId]: {
          ...w,
          days: { ...w.days, [dayIdx]: { ...day, [fieldKey]: value } },
        },
      };
      return next;
    });
    
    // Sincronizar con planificación de forma asíncrona para no bloquear el UI
    if (fieldKey === 'loc' || fieldKey === 'crewList' || fieldKey === 'preList' || fieldKey === 'pickList') {
      // Usar setTimeout para hacer la operación pesada de forma asíncrona
      setTimeout(() => {
        try {
          const planData = storage.getJSON<any>(planKey);
          if (planData) {
            const allWeeks = [...(Array.isArray(planData.pre) ? planData.pre : []), ...(Array.isArray(planData.pro) ? planData.pro : [])];
            const week = allWeeks.find((w: AnyRecord) => w.id === weekId);
            if (week && week.days && week.days[dayIdx]) {
              // Actualizar en planificación
              if (fieldKey === 'loc') {
                week.days[dayIdx].loc = value;
              } else if (fieldKey === 'crewList') {
                // Sincronizar crewList a team en planificación
                week.days[dayIdx].team = Array.isArray(value) ? (value as AnyRecord[]).map(m => ({
                  role: (m?.role || '').toUpperCase(),
                  name: (m?.name || '').trim(),
                  gender: m?.gender,
                })).filter(m => m.role || m.name) : [];
              } else if (fieldKey === 'preList') {
                // Sincronizar preList a prelight en planificación
                week.days[dayIdx].prelight = Array.isArray(value) ? (value as AnyRecord[]).map(m => ({
                  role: (m?.role || '').toUpperCase(),
                  name: (m?.name || '').trim(),
                  gender: m?.gender,
                })).filter(m => m.role || m.name) : [];
              } else if (fieldKey === 'pickList') {
                // Sincronizar pickList a pickup en planificación
                week.days[dayIdx].pickup = Array.isArray(value) ? (value as AnyRecord[]).map(m => ({
                  role: (m?.role || '').toUpperCase(),
                  name: (m?.name || '').trim(),
                  gender: m?.gender,
                })).filter(m => m.role || m.name) : [];
              }
              // Guardar de vuelta en localStorage
              storage.setJSON(planKey, planData);
            }
          }
        } catch (error) {
          console.error(`Error syncing ${fieldKey} to planificación:`, error);
        }
      }, 0);
    }
  }, [readOnly, planKey, setNeeds]);

  const removeFromList = useCallback((weekId: string, dayIdx: number, listKey: string, idx: number) => {
    if (readOnly) return;
    setNeeds((prev: AnyRecord) => {
      const w: AnyRecord = prev[weekId];
      if (!w) return prev;
      const day: AnyRecord = { ...(w.days?.[dayIdx] || {}) };
      const list = Array.isArray(day[listKey]) ? [...(day[listKey] as AnyRecord[])] : [];
      list.splice(idx, 1);
      day[listKey] = list;
      const next: AnyRecord = {
        ...prev,
        [weekId]: {
          ...w,
          days: { ...w.days, [dayIdx]: day },
        },
      };
      
      // Sincronizar con planificación
      setTimeout(() => {
        try {
          const planData = storage.getJSON<any>(planKey);
          if (planData) {
            const allWeeks = [...(Array.isArray(planData.pre) ? planData.pre : []), ...(Array.isArray(planData.pro) ? planData.pro : [])];
            const week = allWeeks.find((w: AnyRecord) => w.id === weekId);
            if (week && week.days && week.days[dayIdx]) {
              // Mapear listKey de necesidades a planificación
              const planListKey = listKey === 'crewList' ? 'team' : listKey === 'preList' ? 'prelight' : listKey === 'pickList' ? 'pickup' : listKey;
              if (planListKey === 'team' || planListKey === 'prelight' || planListKey === 'pickup') {
                week.days[dayIdx][planListKey] = list.map(m => ({
                  role: (m?.role || '').toUpperCase(),
                  name: (m?.name || '').trim(),
                  gender: m?.gender,
                })).filter(m => m.role || m.name);
                storage.setJSON(planKey, planData);
              }
            }
          }
        } catch (error) {
          console.error('Error syncing removeFromList to planificación:', error);
        }
      }, 0);
      
      return next;
    });
  }, [readOnly, planKey, setNeeds]);

  const setWeekOpen = useCallback((weekId: string, isOpen: boolean) => {
    if (readOnly) return;
    try {
      setNeeds((prev: AnyRecord) => {
        const w: AnyRecord = prev[weekId] || {};
        const next: AnyRecord = {
          ...prev,
          [weekId]: { ...w, open: isOpen },
        };
        return next;
      });
    } catch (error) {
      console.error('Error setting week open state:', error);
    }
  }, [readOnly, setNeeds]);

  const swapDays = useCallback((
    weekId1: string,
    dayIdx1: number,
    weekId2: string,
    dayIdx2: number
  ) => {
    if (readOnly) return;
    
    setNeeds((prev: AnyRecord) => {
      const w1: AnyRecord = prev[weekId1] || { days: {} };
      const w2: AnyRecord = prev[weekId2] || { days: {} };
      
      const day1: AnyRecord = (w1.days && w1.days[dayIdx1]) || {};
      const day2: AnyRecord = (w2.days && w2.days[dayIdx2]) || {};
      
      // Crear copias profundas de los datos para intercambiar
      const day1Copy = JSON.parse(JSON.stringify(day1));
      const day2Copy = JSON.parse(JSON.stringify(day2));
      
      // Intercambiar los días
      const next: AnyRecord = {
        ...prev,
        [weekId1]: {
          ...w1,
          days: { ...w1.days, [dayIdx1]: day2Copy },
        },
        [weekId2]: {
          ...w2,
          days: { ...w2.days, [dayIdx2]: day1Copy },
        },
      };
      
      return next;
    });
    
    // Sincronizar con planificación si es necesario (similar a setCell)
    setTimeout(() => {
      try {
        const planData = storage.getJSON<any>(planKey);
        if (planData) {
          const allWeeks = [...(Array.isArray(planData.pre) ? planData.pre : []), ...(Array.isArray(planData.pro) ? planData.pro : [])];
          const week1 = allWeeks.find((w: AnyRecord) => w.id === weekId1);
          const week2 = allWeeks.find((w: AnyRecord) => w.id === weekId2);
          
          if (week1 && week1.days && week1.days[dayIdx1]) {
            const day1Data = JSON.parse(JSON.stringify(week1.days[dayIdx1]));
            if (week2 && week2.days && week2.days[dayIdx2]) {
              const day2Data = JSON.parse(JSON.stringify(week2.days[dayIdx2]));
              week1.days[dayIdx1] = day2Data;
              week2.days[dayIdx2] = day1Data;
              storage.setJSON(planKey, planData);
            }
          }
        }
      } catch (error) {
        console.error('Error syncing swap to planificación:', error);
      }
    }, 0);
  }, [readOnly, planKey, setNeeds]);

  return { setCell, removeFromList, setWeekOpen, swapDays, addCustomRow, updateCustomRowLabel, removeCustomRow };
}

