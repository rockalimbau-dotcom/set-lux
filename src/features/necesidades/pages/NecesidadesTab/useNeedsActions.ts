import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';

interface UseNeedsActionsProps {
  planKey: string;
  readOnly: boolean;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
}

/**
 * Hook for needs actions (setCell, removeFromList, setWeekOpen)
 */
export function useNeedsActions({
  planKey,
  readOnly,
  setNeeds,
}: UseNeedsActionsProps) {
  const { t } = useTranslation();

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
    if (fieldKey === 'loc') {
      // Usar setTimeout para hacer la operación pesada de forma asíncrona
      setTimeout(() => {
        try {
          const planData = storage.getJSON<any>(planKey);
          if (planData) {
            const allWeeks = [...(Array.isArray(planData.pre) ? planData.pre : []), ...(Array.isArray(planData.pro) ? planData.pro : [])];
            const week = allWeeks.find((w: AnyRecord) => w.id === weekId);
            if (week && week.days && week.days[dayIdx]) {
              // Actualizar en planificación
              week.days[dayIdx].loc = value;
              // Guardar de vuelta en localStorage
              storage.setJSON(planKey, planData);
            }
          }
        } catch (error) {
          console.error('Error syncing loc to planificación:', error);
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
      return next;
    });
  }, [readOnly, setNeeds]);

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

  return { setCell, removeFromList, setWeekOpen, swapDays };
}

