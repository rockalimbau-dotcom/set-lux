import { useEffect, useState } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { syncDayListWithRosterBlankOnly } from '@shared/utils/rosterSync';
import { Project } from './ProjectDetailTypes';
import { isEmptyTeam } from './ProjectDetailUtils';

export function useProjectSync(proj: Project | null) {
  const [loaded, setLoaded] = useState(false);

  // Marcar como cargado
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Sincronizar automáticamente las semanas de Necesidades cuando se guarda el equipo
  // Esto permite que las semanas se autocompleten sin necesidad de entrar en Necesidades
  useEffect(() => {
    if (!loaded) return;
    if (!proj?.team || isEmptyTeam(proj.team)) return;

    const needsKey = `needs_${proj?.id || proj?.nombre || 'tmp'}`;
    try {
      const needsData = storage.getJSON<{ pre?: any[]; pro?: any[] }>(needsKey);
      if (!needsData || (!needsData.pre?.length && !needsData.pro?.length)) {
        // No hay semanas, no hay nada que sincronizar
        return;
      }

      const baseTeam = proj.team.base || [];
      const prelightTeam = proj.team.prelight || [];
      const pickupTeam = proj.team.pickup || [];
      const reinforcements = proj.team.reinforcements || [];

      const normalizeDays = (days: any): any[] => {
        if (Array.isArray(days)) return days;
        if (days && typeof days === 'object') {
          const normalized: any[] = [];
          for (let i = 0; i < 7; i++) {
            const byNumber = (days as any)[i];
            const byString = (days as any)[String(i)];
            normalized[i] = byNumber || byString || {};
          }
          return normalized;
        }
        return [];
      };

      const baseRoster = (baseTeam || []).map(m => ({
        role: (m?.role || '').toUpperCase(),
        name: (m?.name || '').trim(),
        gender: (m as any)?.gender,
      }));

      const syncWeek = (w: any) => {
        const days = normalizeDays(w?.days);
        let changed = false;
        const nextDays = days.map(d => {
          const day: any = { ...(d || {}) };
          const tipo = String(day?.crewTipo || '').trim();
          if (tipo === 'Descanso' || tipo === 'Fin') {
            if ((day.crewList || []).length || (day.preList || []).length || (day.pickList || []).length || (day.refList || []).length) {
              changed = true;
            }
            return { ...day, crewList: [], preList: [], pickList: [], refList: [] };
          }

          const crewList = Array.isArray(day.crewList) ? day.crewList : [];
          const nextCrew =
            crewList.length === 0
              ? baseRoster
              : syncDayListWithRosterBlankOnly(crewList, baseTeam as any, 'base');
          if (crewList !== nextCrew) changed = true;

          const preList = Array.isArray(day.preList) ? day.preList : [];
          const nextPre =
            preList.length === 0
              ? preList
              : syncDayListWithRosterBlankOnly(preList, prelightTeam as any, 'pre');
          if (preList !== nextPre) changed = true;

          const pickList = Array.isArray(day.pickList) ? day.pickList : [];
          const nextPick =
            pickList.length === 0
              ? pickList
              : syncDayListWithRosterBlankOnly(pickList, pickupTeam as any, 'pick');
          if (pickList !== nextPick) changed = true;

          const refList = Array.isArray(day.refList) ? day.refList : [];
          const nextRef =
            refList.length === 0
              ? refList
              : syncDayListWithRosterBlankOnly(refList, reinforcements as any, 'ref');
          if (refList !== nextRef) changed = true;

          return {
            ...day,
            crewList: nextCrew,
            preList: nextPre,
            pickList: nextPick,
            refList: nextRef,
          };
        });
        return changed ? { ...w, days: nextDays } : w;
      };

      const syncedPre = (needsData.pre || []).map(syncWeek);
      const syncedPro = (needsData.pro || []).map(syncWeek);

      // Guardar las semanas sincronizadas
      storage.setJSON(needsKey, {
        pre: syncedPre,
        pro: syncedPro,
      });
    } catch (error) {
      // Silenciar errores de sincronización
    }
  }, [proj?.team, proj?.id, proj?.nombre, loaded]);

  return { loaded };
}

