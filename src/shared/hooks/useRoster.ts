import { useMemo } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';

interface TeamMember {
  role?: string;
  name?: string;
  [key: string]: any;
}

export function useRoster(
  project: AnyRecord | undefined,
  baseTeam: TeamMember[],
  prelightTeam: TeamMember[],
  pickupTeam: TeamMember[],
  reinforcements: TeamMember[]
) {
  return useMemo(() => {
    const fromProps = {
      base: Array.isArray(baseTeam) ? baseTeam : [],
      prelight: Array.isArray(prelightTeam) ? prelightTeam : [],
      pickup: Array.isArray(pickupTeam) ? pickupTeam : [],
      reinforcements: Array.isArray(reinforcements) ? reinforcements : [],
    };
    const hasProps =
      fromProps.base.length ||
      fromProps.prelight.length ||
      fromProps.pickup.length ||
      fromProps.reinforcements.length;

    if (hasProps) {
      return {
        baseRoster: fromProps.base,
        preRoster: fromProps.prelight,
        pickRoster: fromProps.pickup,
        refsRoster: fromProps.reinforcements,
      };
    }

    const keys: string[] = [];
    if (project?.id || project?.nombre) {
      const pid = project?.id || project?.nombre;
      keys.push(`team_${pid}`);
      keys.push(`setlux_equipo_${pid}`);
    }
    keys.push('setlux_equipo_global_v2');

    let saved: AnyRecord | null = null;
    for (const k of keys) {
      try {
        const obj = storage.getJSON<AnyRecord>(k);
        if (obj) {
          saved = obj;
          break;
        }
      } catch {}
    }

    const src: AnyRecord = saved || {};
    return {
      baseRoster: Array.isArray(src.base) ? src.base : [],
      preRoster: Array.isArray(src.prelight) ? src.prelight : [],
      pickRoster: Array.isArray(src.pickup) ? src.pickup : [],
      refsRoster: Array.isArray(src.reinforcements) ? src.reinforcements : [],
    };
  }, [
    project?.id,
    project?.nombre,
    baseTeam,
    prelightTeam,
    pickupTeam,
    reinforcements,
  ]);
}
