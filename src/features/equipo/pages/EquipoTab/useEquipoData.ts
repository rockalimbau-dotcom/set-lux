import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { AnyRecord } from '@shared/types/common';
import { sortTeam, normalizeInitial, normalizeTeamMember, harmonizeTeamPersonIds } from './EquipoTabUtils';
import { TeamData } from './EquipoTabTypes';

interface UseEquipoDataProps {
  initialTeam?: AnyRecord;
  storageKey: string;
  currentUser: AnyRecord;
  project?: AnyRecord;
}

/**
 * Hook for managing equipo data
 */
export function useEquipoData({
  initialTeam,
  storageKey,
  currentUser,
  project,
}: UseEquipoDataProps) {
  const normalizeList = (list: AnyRecord[]) =>
    (list || []).map(item => normalizeTeamMember(project, item));

  const initialTeamData = {
    base: normalizeList(initialTeam?.base || []),
    reinforcements: normalizeList(initialTeam?.reinforcements || []),
    prelight: normalizeList(initialTeam?.prelight || []),
    pickup: normalizeList(initialTeam?.pickup || []),
    enabledGroups: {
      prelight: initialTeam?.enabledGroups?.prelight ?? false,
      pickup: initialTeam?.enabledGroups?.pickup ?? false,
    },
  };

  const [teamData, setTeamData] = useLocalStorage(storageKey, initialTeamData);

  const normalized = useMemo(() => {
    const base = normalizeInitial(initialTeam || {}, currentUser, project);
    return {
      ...base,
      base: normalizeList(base.base || []),
      reinforcements: normalizeList(base.reinforcements || []),
      prelight: normalizeList(base.prelight || []),
      pickup: normalizeList(base.pickup || []),
    };
  }, [initialTeam, currentUser, project]);

  const [team, setTeam] = useState(() => {
    return {
      base: sortTeam(normalized.base, project),
      reinforcements: sortTeam(normalized.reinforcements, project),
      prelight: sortTeam(normalized.prelight, project),
      pickup: sortTeam(normalized.pickup, project),
    };
  });

  const [groupsEnabled, setGroupsEnabled] = useState((teamData as AnyRecord).enabledGroups);

  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
  }, [storageKey]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      if (storageKey) {
        const raw = teamData ? JSON.stringify(teamData) : null;
        if (raw) {
          const saved = JSON.parse(raw);
          // Filtrar REF del equipo base, refuerzos, prelight y pickup - el rol 'REF' ya no se usa
          const baseFiltered = (saved.base ?? []).filter((r: AnyRecord) => r.role !== 'REF');
          const reinforcementsFiltered = (saved.reinforcements ?? []).filter((r: AnyRecord) => r.role !== 'REF');
          const prelightFiltered = (saved.prelight ?? []).filter((r: AnyRecord) => r.role !== 'REF');
          const pickupFiltered = (saved.pickup ?? []).filter((r: AnyRecord) => r.role !== 'REF');
          
          const merged = harmonizeTeamPersonIds({
            base: normalizeList(baseFiltered),
            reinforcements: normalizeList(reinforcementsFiltered),
            prelight: normalizeList(prelightFiltered),
            pickup: normalizeList(pickupFiltered),
            enabledGroups: {
              prelight: saved.enabledGroups?.prelight ?? false,
              pickup: saved.enabledGroups?.pickup ?? false,
            },
          });
          const hadRig =
            (baseFiltered || []).some((r: AnyRecord) => String(r?.role || '').toUpperCase() === 'RIG') ||
            (reinforcementsFiltered || []).some((r: AnyRecord) => String(r?.role || '').toUpperCase() === 'RIG') ||
            (prelightFiltered || []).some((r: AnyRecord) => String(r?.role || '').toUpperCase() === 'RIG') ||
            (pickupFiltered || []).some((r: AnyRecord) => String(r?.role || '').toUpperCase() === 'RIG');
          setTeam({
            base: sortTeam(merged.base, project),
            reinforcements: sortTeam(merged.reinforcements, project),
            prelight: sortTeam(merged.prelight, project),
            pickup: sortTeam(merged.pickup, project),
          });
          setGroupsEnabled({ ...merged.enabledGroups });
          if (hadRig) {
            setTeamData({
              base: sortTeam(merged.base, project),
              reinforcements: sortTeam(merged.reinforcements, project),
              prelight: sortTeam(merged.prelight, project),
              pickup: sortTeam(merged.pickup, project),
              enabledGroups: { ...merged.enabledGroups },
            });
          }
        } else {
          // Filtrar REF del equipo base, refuerzos, prelight y pickup - el rol 'REF' ya no se usa
          const baseFiltered = (initialTeam?.base || []).filter((r: AnyRecord) => r.role !== 'REF');
          const reinforcementsFiltered = (initialTeam?.reinforcements || []).filter((r: AnyRecord) => r.role !== 'REF');
          const prelightFiltered = (initialTeam?.prelight || []).filter((r: AnyRecord) => r.role !== 'REF');
          const pickupFiltered = (initialTeam?.pickup || []).filter((r: AnyRecord) => r.role !== 'REF');
          
          const payload = harmonizeTeamPersonIds({
            base: sortTeam(normalizeList(baseFiltered), project),
            reinforcements: sortTeam(normalizeList(reinforcementsFiltered), project),
            prelight: sortTeam(normalizeList(prelightFiltered), project),
            pickup: sortTeam(normalizeList(pickupFiltered), project),
            enabledGroups: {
              prelight: initialTeam?.enabledGroups?.prelight ?? false,
              pickup: initialTeam?.enabledGroups?.pickup ?? false,
            },
          });
          setTeamData(payload);
        }
      }
    } catch {}
  }, [storageKey, teamData, setTeamData, initialTeam, project]);

  return { team, setTeam, groupsEnabled, setGroupsEnabled, teamData, setTeamData };
}
