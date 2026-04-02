import { useMemo } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';
import { resolveMemberProjectRole } from '@shared/utils/projectRoles';

interface TeamMember {
  personId?: string;
  role?: string;
  roleId?: string;
  roleLabel?: string;
  name?: string;
  source?: string;
  gender?: 'male' | 'female' | 'neutral';
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
    const enrichRoster = (items: TeamMember[] = []): TeamMember[] =>
      (Array.isArray(items) ? items : []).map(member => {
        const resolvedRole = resolveMemberProjectRole(project, member);
        const roleLabel = String(member?.roleLabel || '').trim() || resolvedRole.label || undefined;
        const roleId = member?.roleId || resolvedRole.roleId || undefined;
        return {
          ...member,
          roleId,
          roleLabel,
        };
      });

    const fromProps = {
      base: enrichRoster(baseTeam),
      prelight: enrichRoster(prelightTeam),
      pickup: enrichRoster(pickupTeam),
      reinforcements: enrichRoster(reinforcements),
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

    const projectTeam = project?.team;
    const fromProject = {
      base: enrichRoster(projectTeam?.base),
      prelight: enrichRoster(projectTeam?.prelight),
      pickup: enrichRoster(projectTeam?.pickup),
      reinforcements: enrichRoster(projectTeam?.reinforcements),
    };
    const hasProjectTeam =
      fromProject.base.length ||
      fromProject.prelight.length ||
      fromProject.pickup.length ||
      fromProject.reinforcements.length;

    if (hasProjectTeam) {
      return {
        baseRoster: fromProject.base,
        preRoster: fromProject.prelight,
        pickRoster: fromProject.pickup,
        refsRoster: fromProject.reinforcements,
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
      baseRoster: enrichRoster(src.base),
      preRoster: enrichRoster(src.prelight),
      pickRoster: enrichRoster(src.pickup),
      refsRoster: enrichRoster(src.reinforcements),
    };
  }, [
    project?.id,
    project?.nombre,
    project?.team,
    project?.roleCatalog,
    baseTeam,
    prelightTeam,
    pickupTeam,
    reinforcements,
  ]);
}
