import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { AnyRecord } from '@shared/types/common';
import { sortTeam, normalizeInitial } from './EquipoTabUtils';
import { TeamData } from './EquipoTabTypes';

interface UseEquipoDataProps {
  initialTeam?: AnyRecord;
  storageKey: string;
  currentUser: AnyRecord;
}

/**
 * Hook for managing equipo data
 */
export function useEquipoData({
  initialTeam,
  storageKey,
  currentUser,
}: UseEquipoDataProps) {
  const initialTeamData = {
    base: initialTeam?.base || [],
    reinforcements: initialTeam?.reinforcements || [],
    prelight: initialTeam?.prelight || [],
    pickup: initialTeam?.pickup || [],
    enabledGroups: {
      prelight: initialTeam?.enabledGroups?.prelight ?? false,
      pickup: initialTeam?.enabledGroups?.pickup ?? false,
    },
  };

  const [teamData, setTeamData] = useLocalStorage(storageKey, initialTeamData);

  const normalized = useMemo(() => normalizeInitial(initialTeam || {}, currentUser), [initialTeam, currentUser]);

  const [team, setTeam] = useState(() => {
    return {
      base: sortTeam(normalized.base),
      reinforcements: sortTeam(normalized.reinforcements),
      prelight: sortTeam(normalized.prelight),
      pickup: sortTeam(normalized.pickup),
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
          const merged = {
            base: saved.base ?? [],
            reinforcements: saved.reinforcements ?? [],
            prelight: saved.prelight ?? [],
            pickup: saved.pickup ?? [],
            enabledGroups: {
              prelight: saved.enabledGroups?.prelight ?? false,
              pickup: saved.enabledGroups?.pickup ?? false,
            },
          };
          setTeam({
            base: sortTeam(merged.base),
            reinforcements: sortTeam(merged.reinforcements),
            prelight: sortTeam(merged.prelight),
            pickup: sortTeam(merged.pickup),
          });
          setGroupsEnabled({ ...merged.enabledGroups });
        } else {
          const payload = {
            base: sortTeam(initialTeam?.base || []),
            reinforcements: sortTeam(initialTeam?.reinforcements || []),
            prelight: sortTeam(initialTeam?.prelight || []),
            pickup: sortTeam(initialTeam?.pickup || []),
            enabledGroups: {
              prelight: initialTeam?.enabledGroups?.prelight ?? false,
              pickup: initialTeam?.enabledGroups?.pickup ?? false,
            },
          };
          setTeamData(payload);
        }
      }
    } catch {}
  }, [storageKey, teamData, setTeamData, initialTeam]);

  return { team, setTeam, groupsEnabled, setGroupsEnabled, teamData, setTeamData };
}

