import { useMemo } from 'react';
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
      const k = `${m.role}|${m.name}`;
      if (!seen.has(k)) {
        seen.add(k);
        unique.push({ role: m.role, name: m.name });
      }
    }
    const order: Record<string, number> = {
      G: 0,
      BB: 1,
      E: 2,
      TM: 3,
      FB: 4,
      AUX: 5,
      M: 6,
      RG: 7,
      RBB: 8,
      RE: 9,
      TG: 10,
      EPO: 11,
      TP: 12,
      REF: 13,
      RIG: 14,
    };
    unique.sort(
      (a, b) =>
        (order[a.role] ?? 99) - (order[b.role] ?? 99) ||
        a.name.localeCompare(b.name, 'es')
    );
    return unique;
  }, [project?.team]);
}

