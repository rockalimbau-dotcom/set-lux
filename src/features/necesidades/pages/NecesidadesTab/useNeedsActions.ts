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
    // Si se está cambiando localización, sincronizar con planificación
    if (fieldKey === 'loc') {
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
    }

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

  return { setCell, removeFromList, setWeekOpen };
}

