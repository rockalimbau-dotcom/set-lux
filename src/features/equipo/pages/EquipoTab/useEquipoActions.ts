import { useEffect, useMemo, useRef, useState } from 'react';
import { AnyRecord } from '@shared/types/common';
import { sortTeam } from './EquipoTabUtils';

interface UseEquipoActionsProps {
  team: {
    base: AnyRecord[];
    reinforcements: AnyRecord[];
    prelight: AnyRecord[];
    pickup: AnyRecord[];
  };
  groupsEnabled: {
    prelight: boolean;
    pickup: boolean;
  };
  setTeam: React.Dispatch<React.SetStateAction<{
    base: AnyRecord[];
    reinforcements: AnyRecord[];
    prelight: AnyRecord[];
    pickup: AnyRecord[];
  }>>;
  setGroupsEnabled: React.Dispatch<React.SetStateAction<{
    prelight: boolean;
    pickup: boolean;
  }>>;
  setTeamData: (value: any) => void;
  storageKey: string;
  onChange?: (payload: AnyRecord) => void;
}

/**
 * Hook for equipo actions and side effects
 */
export function useEquipoActions({
  team,
  groupsEnabled,
  setTeam,
  setGroupsEnabled,
  setTeamData,
  storageKey,
  onChange,
}: UseEquipoActionsProps) {
  const [, setSeqCounter] = useState(0);
  const nextSeq = () => {
    let next: number;
    setSeqCounter(s => {
      next = s + 1;
      return next;
    });
    return next!;
  };

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const payloadMemo = useMemo(
    () => ({
      base: team.base,
      reinforcements: team.reinforcements,
      prelight: team.prelight,
      pickup: team.pickup,
      enabledGroups: { ...groupsEnabled },
    }),
    [team, groupsEnabled]
  );

  const lastSavedRef = useRef('');

  // Update sequence counter
  useEffect(() => {
    const maxSeq = Math.max(
      -1,
      ...(['base', 'reinforcements', 'prelight', 'pickup'] as const).flatMap(k =>
        (team[k] || []).map(r => r.seq ?? 0)
      )
    );
    setSeqCounter(maxSeq + 1);
  }, [storageKey, team]);

  // Save changes
  useEffect(() => {
    const json = JSON.stringify(payloadMemo);
    if (json === lastSavedRef.current) return;
    lastSavedRef.current = json;
    try {
      setTeamData(JSON.parse(json));
    } catch {}
    onChangeRef.current?.(payloadMemo);
  }, [payloadMemo, storageKey, setTeamData]);

  const enableGroup = (key: string) => setGroupsEnabled((g: AnyRecord) => ({ ...g, [key]: true }));
  const disableGroup = (key: string) => {
    setGroupsEnabled((g: AnyRecord) => ({ ...g, [key]: false }));
    setTeam(t => ({ ...t, [key]: [] }));
  };

  return { nextSeq, enableGroup, disableGroup };
}

