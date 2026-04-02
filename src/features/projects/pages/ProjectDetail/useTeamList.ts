import { useMemo } from 'react';
import { getMemberRoleSortOrder } from '@shared/utils/projectRoles';
import { Project, TeamMember } from './ProjectDetailTypes';

export function useTeamList(project: Project | null): TeamMember[] {
  return useMemo(() => {
    const t = project?.team || {
      base: [],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    };
    const all = [
      ...(t.base || []),
      ...(t.reinforcements || []),
      ...(t.prelight || []),
      ...(t.pickup || []),
    ].filter(m => m && m.name);

    const seen = new Set<string>();
    const unique: TeamMember[] = [];
    for (const m of all) {
      const k = `${m.personId || `${m.roleId || m.role}|${m.name}`}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push({
          personId: m.personId,
          role: m.role,
          roleId: m.roleId,
          roleLabel: m.roleLabel,
          name: m.name,
          source: m.source,
          gender: m.gender,
        });
      }
    }
    unique.sort(
      (a, b) =>
        getMemberRoleSortOrder(project, a) - getMemberRoleSortOrder(project, b) ||
        a.name.localeCompare(b.name, 'es')
    );
    return unique;
  }, [project?.team]);
}
