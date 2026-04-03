import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { storage, STORAGE_CHANGE_EVENT } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';
import { applyExtraBlocksToDay, normalizeExtraBlocks } from '@shared/utils/extraBlocks';

interface UseNeedsSyncProps {
  planKey: string;
  storageKey: string;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
  setHasError: (hasError: boolean) => void;
  setErrorMessage: (message: string) => void;
}

/**
 * Hook for syncing needs data from planificación
 */
export function useNeedsSync({
  planKey,
  storageKey,
  setNeeds,
  setHasError,
  setErrorMessage,
}: UseNeedsSyncProps) {
  const { t } = useTranslation();
  const lastPlanRawRef = useRef<string | null>(null);

  const syncFromPlanRaw = useCallback((rawPlan: string | null) => {
    try {
      let plan: AnyRecord | null = null;
      try {
        plan = rawPlan ? JSON.parse(rawPlan) : null;
      } catch (parseError) {
        console.error('Error parsing plan data:', parseError);
        setNeeds({});
        return;
      }

      if (!plan) {
        setNeeds(prev => {
          if (Object.keys(prev).length === 0) return prev;
          return prev;
        });
        return;
      }

      const pre = Array.isArray(plan?.pre) ? plan.pre : [];
      const pro = Array.isArray(plan?.pro) ? plan.pro : [];
      const all = [...pre, ...pro];
      
      if (!all.length) {
        setNeeds((prev: AnyRecord) => {
          if (Object.keys(prev).length === 0) return prev;
          return prev;
        });
        return;
      }

      setNeeds((prev: AnyRecord) => {
        try {
          const storedNeeds = storage.getJSON<any>(storageKey) || {};
          const storedById = new Map<string, AnyRecord>();
          const storedByMonday = new Map<string, AnyRecord>();
          for (const [wid, wk] of Object.entries(storedNeeds)) {
            const week = wk as AnyRecord;
            storedById.set(wid, week);
            if (week?.startDate) storedByMonday.set(week.startDate as string, week);
          }

          const next: AnyRecord = { ...prev };

          const byMondayPrev = new Map<string, { wid: string; wk: AnyRecord }>();
          for (const [wid, wk] of Object.entries(prev)) {
            const week = wk as AnyRecord;
            if (week?.startDate) byMondayPrev.set(week.startDate as string, { wid, wk: week });
          }

          for (const w of all as AnyRecord[]) {
            const monday = w.startDate as string;

            if (!next[w.id as string]) {
              const prevByMon = byMondayPrev.get(monday);
              if (prevByMon && !next[w.id as string]) {
                const cloned = { ...(prevByMon.wk as AnyRecord) };
                delete next[prevByMon.wid];
                next[w.id as string] = { ...cloned, label: w.label, startDate: w.startDate };
              } else {
                const storedWeek = storedById.get(w.id as string) || storedByMonday.get(monday);
                next[w.id as string] = {
                  label: w.label,
                  startDate: w.startDate,
                  open: true,
                  days: {},
                  customRows: storedWeek?.customRows || [],
                  rowLabels: storedWeek?.rowLabels || {},
                };
              }
            } else {
              const storedWeek = storedById.get(w.id as string) || storedByMonday.get(monday);
              next[w.id as string] = {
                ...(next[w.id as string] as AnyRecord),
                label: w.label,
                startDate: w.startDate,
                days: (next[w.id as string] as AnyRecord).days || {},
                customRows: (next[w.id as string] as AnyRecord).customRows || storedWeek?.customRows || [],
                rowLabels: (next[w.id as string] as AnyRecord).rowLabels || storedWeek?.rowLabels || [],
              } as AnyRecord;
            }

            for (let i = 0; i < 7; i++) {
              const day: AnyRecord = (next[w.id as string].days?.[i] as AnyRecord) || {};
              const planDay: AnyRecord = (w.days && (w.days as AnyRecord[])[i]) || {};

              // Sincronizar equipo técnico desde planificación
              day.crewList = Array.isArray(planDay.team)
                ? (planDay.team as AnyRecord[])
                    .map(m => ({
                      personId: m?.personId,
                      role: (m?.role || '').toUpperCase(),
                      roleId: m?.roleId,
                      roleLabel: m?.roleLabel,
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                      source: m?.source,
                    }))
                    .filter(m => m.role || m.name)
                : [];
              
              // Sincronizar equipo prelight desde planificación
              day.preList = Array.isArray(planDay.prelight)
                ? (planDay.prelight as AnyRecord[])
                    .map(m => ({
                      personId: m?.personId,
                      role: (m?.role || '').toUpperCase(),
                      roleId: m?.roleId,
                      roleLabel: m?.roleLabel,
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                      source: m?.source,
                    }))
                    .filter(m => m.role || m.name)
                : [];
              
              // Sincronizar equipo recogida desde planificación
              day.pickList = Array.isArray(planDay.pickup)
                ? (planDay.pickup as AnyRecord[])
                    .map(m => ({
                      personId: m?.personId,
                      role: (m?.role || '').toUpperCase(),
                      roleId: m?.roleId,
                      roleLabel: m?.roleLabel,
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                      source: m?.source,
                    }))
                    .filter(m => m.role || m.name)
                : [];

              // Sincronizar localización desde planificación
              if (planDay.loc !== undefined) {
                day.loc = planDay.loc || '';
              } else {
                day.loc = day.loc || '';
              }
              if (planDay.tipo !== undefined) {
                day.tipo = planDay.tipo || '';
              } else {
                day.tipo = day.tipo || '';
              }
              if (planDay.start !== undefined) {
                day.start = planDay.start || '';
              } else {
                day.start = day.start || '';
              }
              if (planDay.end !== undefined) {
                day.end = planDay.end || '';
              } else {
                day.end = day.end || '';
              }
              day.seq = day.seq || '';
              day.needLoc = day.needLoc || '';
              day.needProd = day.needProd || '';
              day.needTransport = day.needTransport || '';
              day.transportExtra = day.transportExtra || '';
              day.needGroups = day.needGroups || '';
              day.needCranes = day.needCranes || '';
              day.needLight = day.needLight || '';
              day.extraMat = day.extraMat || '';
              day.precall = day.precall || '';
              day.obs = day.obs || '';
              day.crewTxt = day.crewTxt || '';
              day.refList = Array.isArray(day.refList) ? day.refList : [];
              day.refTxt = day.refTxt || '';
              day.refTipo = day.refTipo || '';
              day.refStart = day.refStart || '';
              day.refEnd = day.refEnd || '';
              Object.assign(day, applyExtraBlocksToDay(day, normalizeExtraBlocks(day)));
              day.preTxt = day.preTxt || '';
              day.prelightTipo = day.prelightTipo || (day as AnyRecord).preTipo || '';
              day.preStart = day.preStart || '';
              day.preEnd = day.preEnd || '';
              day.pickTxt = day.pickTxt || '';
              day.pickupTipo = day.pickupTipo || (day as AnyRecord).pickTipo || '';
              day.pickStart = day.pickStart || '';
              day.pickEnd = day.pickEnd || '';

              (next[w.id as string].days as AnyRecord)[i] = day;
            }

            if (typeof (next[w.id as string] as AnyRecord).open === 'undefined') {
              try {
                let rawOpen: string | null = null;
                (next[w.id as string] as AnyRecord).open = rawOpen != null ? JSON.parse(rawOpen) === true : true;
              } catch {
                (next[w.id as string] as AnyRecord).open = true;
              }
            }
          }

          const validIds = new Set((all as AnyRecord[]).map(w => w.id as string));
          for (const wid of Object.keys(next)) {
            if (!validIds.has(wid)) delete next[wid];
          }
          return next;
        } catch (error) {
          console.error('Error updating needs state:', error);
          return prev;
        }
      });
    } catch (error) {
      console.error('Error in syncFromPlanRaw:', error);
      setHasError(true);
      setErrorMessage(t('needs.errorSyncingPlanning'));
    }
  }, [setNeeds, setHasError, setErrorMessage, t]);

  // Initial load
  useEffect(() => {
    try {
      const obj = storage.getJSON<any>(planKey);
      const raw = obj ? JSON.stringify(obj, Object.keys(obj).sort()) : '';
      lastPlanRawRef.current = raw;
      syncFromPlanRaw(raw);
    } catch (error) {
      console.error('Error loading plan data:', error);
      setHasError(true);
      setErrorMessage(t('needs.errorLoadingPlanning'));
    }
  }, [planKey, syncFromPlanRaw, setHasError, setErrorMessage, t]);

  // Storage event listener
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === planKey) {
        try {
          const obj = storage.getJSON<any>(planKey);
          const raw = obj ? JSON.stringify(obj, Object.keys(obj).sort()) : '';
          lastPlanRawRef.current = raw;
          syncFromPlanRaw(raw);
        } catch (error) {
          console.error('Error handling storage event:', error);
        }
      }
    };
    const onLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string; newValue?: string | null }>).detail;
      if (!detail || detail.key !== planKey) return;
      try {
        const obj = storage.getJSON<any>(planKey);
        const raw = obj ? JSON.stringify(obj, Object.keys(obj).sort()) : '';
        lastPlanRawRef.current = raw;
        syncFromPlanRaw(raw);
      } catch (error) {
        console.error('Error handling local storage change event:', error);
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    };
  }, [planKey, syncFromPlanRaw]);

  return { syncFromPlanRaw };
}
