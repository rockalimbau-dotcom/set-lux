import { useEffect, useRef, useState } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { syncDayListWithRosterBlankOnly } from '@shared/utils/rosterSync';
import { resolveMemberProjectRole } from '@shared/utils/projectRoles';
import { Project } from './ProjectDetailTypes';
import { isEmptyTeam } from './ProjectDetailUtils';

const getMemberIdentityKey = (member: any): string =>
  `${String(member?.personId || member?.roleId || member?.role || '').trim().toUpperCase()}::${String(member?.name || '').trim()}`;

export function useProjectSync(proj: Project | null) {
  const [loaded, setLoaded] = useState(false);
  const teamKey = `team_${proj?.id || proj?.nombre || 'tmp'}`;
  const [storedTeam] = useLocalStorage<any>(teamKey, null);
  const previousTeamRef = useRef<any>(null);

  // Marcar como cargado
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Sincronizar automáticamente las semanas de Necesidades cuando se guarda el equipo
  // Esto permite que las semanas se autocompleten sin necesidad de entrar en Necesidades
  useEffect(() => {
    if (!loaded) return;
    const effectiveTeam =
      storedTeam && !isEmptyTeam(storedTeam)
        ? storedTeam
        : proj?.team;
    if (!effectiveTeam || isEmptyTeam(effectiveTeam)) {
      previousTeamRef.current = effectiveTeam;
      return;
    }

    const needsKey = `needs_${proj?.id || proj?.nombre || 'tmp'}`;
    try {
      const needsData = storage.getJSON<{ pre?: any[]; pro?: any[] }>(needsKey);
      if (!needsData || (!needsData.pre?.length && !needsData.pro?.length)) {
        // No hay semanas, no hay nada que sincronizar
        return;
      }

      const baseTeam = effectiveTeam.base || [];
      const prelightTeam = effectiveTeam.prelight || [];
      const pickupTeam = effectiveTeam.pickup || [];
      const reinforcements = effectiveTeam.reinforcements || [];

      const buildRenameMap = (prevList: any[] = [], nextList: any[] = []) => {
        const map = new Map<string, { name: string; gender?: string; roleId?: string; roleLabel?: string }>();
        const nextById = new Map(
          (nextList || [])
            .filter(item => item?.id)
            .map(item => [item.id, item])
        );
        for (const prevItem of prevList || []) {
          if (!prevItem?.id) continue;
          const nextItem = nextById.get(prevItem.id);
          if (!nextItem) continue;
          const prevRoleKey = String(prevItem.roleId || prevItem.role || '').trim().toUpperCase();
          const nextRoleKey = String(nextItem.roleId || nextItem.role || '').trim().toUpperCase();
          const prevName = String(prevItem.name || '').trim();
          const nextName = String(nextItem.name || '').trim();
          if (!prevRoleKey || !prevName || !nextRoleKey || !nextName) continue;
          if (prevRoleKey !== nextRoleKey) continue;
          if (prevName === nextName) continue;
          const resolvedNextRole = resolveMemberProjectRole(proj, nextItem);
          map.set(getMemberIdentityKey(prevItem), {
            name: nextName,
            gender: nextItem.gender,
            personId: nextItem.personId,
            roleId: nextItem.roleId,
            roleLabel: resolvedNextRole.label,
          });
        }
        return map;
      };

      const previousTeam = previousTeamRef.current || {};
      const renameMaps = {
        base: buildRenameMap(previousTeam.base, baseTeam),
        pre: buildRenameMap(previousTeam.prelight, prelightTeam),
        pick: buildRenameMap(previousTeam.pickup, pickupTeam),
        ref: buildRenameMap(previousTeam.reinforcements, reinforcements),
      };

      const applyRenameMap = (
        list: any[] = [],
        renameMap: Map<string, { name: string; gender?: string; personId?: string; roleId?: string; roleLabel?: string }>
      ) =>
        (list || []).map(item => {
          const key = getMemberIdentityKey(item);
          const renamed = renameMap.get(key);
          if (!renamed) return item;
          return {
            ...item,
            name: renamed.name,
            gender: renamed.gender ?? item?.gender,
            personId: renamed.personId ?? item?.personId,
            roleId: renamed.roleId ?? item?.roleId,
            roleLabel: renamed.roleLabel ?? item?.roleLabel,
            rosterManaged: true,
          };
        });

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

      const baseRoster = (baseTeam || []).map(m => {
        const resolvedRole = resolveMemberProjectRole(proj, m);
        return {
          role: (m?.role || '').toUpperCase(),
          personId: m?.personId,
          roleId: m?.roleId,
          roleLabel: resolvedRole.label,
          name: (m?.name || '').trim(),
          gender: (m as any)?.gender,
          source: 'base',
          rosterManaged: true,
        };
      });

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
          day.crewList = applyRenameMap(crewList, renameMaps.base);
          const nextCrew =
            day.crewList.length === 0
              ? baseRoster
              : syncDayListWithRosterBlankOnly(day.crewList, baseTeam as any, 'base');
          if (JSON.stringify(crewList) !== JSON.stringify(nextCrew)) changed = true;

          const preList = Array.isArray(day.preList) ? day.preList : [];
          day.preList = applyRenameMap(preList, renameMaps.pre);
          const nextPre =
            day.preList.length === 0
              ? day.preList
              : syncDayListWithRosterBlankOnly(day.preList, prelightTeam as any, 'pre');
          if (JSON.stringify(preList) !== JSON.stringify(nextPre)) changed = true;

          const pickList = Array.isArray(day.pickList) ? day.pickList : [];
          day.pickList = applyRenameMap(pickList, renameMaps.pick);
          const nextPick =
            day.pickList.length === 0
              ? day.pickList
              : syncDayListWithRosterBlankOnly(day.pickList, pickupTeam as any, 'pick');
          if (JSON.stringify(pickList) !== JSON.stringify(nextPick)) changed = true;

          const refList = Array.isArray(day.refList) ? day.refList : [];
          day.refList = applyRenameMap(refList, renameMaps.ref);
          const nextRef =
            day.refList.length === 0
              ? day.refList
              : syncDayListWithRosterBlankOnly(day.refList, reinforcements as any, 'ref');
          if (JSON.stringify(refList) !== JSON.stringify(nextRef)) changed = true;

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

      const hasPreChanges =
        syncedPre.length !== (needsData.pre || []).length ||
        syncedPre.some((week, index) => week !== (needsData.pre || [])[index]);
      const hasProChanges =
        syncedPro.length !== (needsData.pro || []).length ||
        syncedPro.some((week, index) => week !== (needsData.pro || [])[index]);

      if (!hasPreChanges && !hasProChanges) {
        previousTeamRef.current = effectiveTeam;
        return;
      }

      // Guardar las semanas sincronizadas solo si algo ha cambiado de verdad
      storage.setJSON(needsKey, {
        pre: syncedPre,
        pro: syncedPro,
      });
    } catch (error) {
      // Silenciar errores de sincronización
    }
    previousTeamRef.current = effectiveTeam;
  }, [proj?.team, proj?.id, proj?.nombre, storedTeam, loaded]);

  return { loaded };
}
