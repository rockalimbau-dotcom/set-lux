import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';

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
              } as AnyRecord;
            }

            for (let i = 0; i < 7; i++) {
              const day: AnyRecord = (next[w.id as string].days?.[i] as AnyRecord) || {};
              const planDay: AnyRecord = (w.days && (w.days as AnyRecord[])[i]) || {};

              // Sincronizar equipo técnico desde planificación
              day.crewList = Array.isArray(planDay.team)
                ? (planDay.team as AnyRecord[])
                    .map(m => ({
                      role: (m?.role || '').toUpperCase(),
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                    }))
                    .filter(m => m.role || m.name)
                : [];
              
              // Sincronizar equipo prelight desde planificación
              day.preList = Array.isArray(planDay.prelight)
                ? (planDay.prelight as AnyRecord[])
                    .map(m => ({
                      role: (m?.role || '').toUpperCase(),
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                    }))
                    .filter(m => m.role || m.name)
                : [];
              
              // Sincronizar equipo recogida desde planificación
              day.pickList = Array.isArray(planDay.pickup)
                ? (planDay.pickup as AnyRecord[])
                    .map(m => ({
                      role: (m?.role || '').toUpperCase(),
                      name: (m?.name || '').trim(),
                      gender: m?.gender,
                    }))
                    .filter(m => m.role || m.name)
                : [];

              // Sincronizar localización desde planificación
              if (planDay.loc !== undefined) {
                day.loc = planDay.loc || '';
              } else {
                day.loc = day.loc || '';
              }
              day.seq = day.seq || '';
              day.needLoc = day.needLoc || '';
              day.needProd = day.needProd || '';
              day.needTransport = day.needTransport || '';
              day.needGroups = day.needGroups || '';
              day.needLight = day.needLight || '';
              day.extraMat = day.extraMat || '';
              day.precall = day.precall || '';
              day.obs = day.obs || '';
              day.crewTxt = day.crewTxt || '';
              day.preTxt = day.preTxt || '';
              day.pickTxt = day.pickTxt || '';

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
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [planKey, syncFromPlanRaw]);

  // Polling for changes
  useEffect(() => {
    const tick = () => {
      try {
        const obj = storage.getJSON<any>(planKey);
        if (!obj) {
          const raw = '';
          if (lastPlanRawRef.current !== raw) {
            lastPlanRawRef.current = raw;
            syncFromPlanRaw(raw);
          }
          return;
        }
        // Crear una versión normalizada del objeto para comparación
        const normalized = {
          pre: Array.isArray(obj.pre) ? obj.pre.map((w: AnyRecord) => ({
            id: w.id,
            label: w.label,
            startDate: w.startDate,
            days: Array.isArray(w.days) ? w.days.map((d: AnyRecord) => ({
              team: Array.isArray(d.team) ? d.team.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
                gender: m?.gender,
              })) : [],
              prelight: Array.isArray(d.prelight) ? d.prelight.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
                gender: m?.gender,
              })) : [],
              pickup: Array.isArray(d.pickup) ? d.pickup.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
                gender: m?.gender,
              })) : [],
              loc: d.loc || '',
            })) : [],
          })) : [],
          pro: Array.isArray(obj.pro) ? obj.pro.map((w: AnyRecord) => ({
            id: w.id,
            label: w.label,
            startDate: w.startDate,
            days: Array.isArray(w.days) ? w.days.map((d: AnyRecord) => ({
              team: Array.isArray(d.team) ? d.team.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              prelight: Array.isArray(d.prelight) ? d.prelight.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              pickup: Array.isArray(d.pickup) ? d.pickup.map((m: AnyRecord) => ({
                role: m?.role || '',
                name: m?.name || '',
              })) : [],
              loc: d.loc || '',
            })) : [],
          })) : [],
        };
        const raw = JSON.stringify(normalized);
        if (lastPlanRawRef.current !== raw) {
          lastPlanRawRef.current = raw;
          syncFromPlanRaw(JSON.stringify(obj));
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [planKey, syncFromPlanRaw]);

  return { syncFromPlanRaw };
}

