import { ProjectTeam } from './ProjectDetailTypes';

export const isEmptyTeam = (t: ProjectTeam | undefined): boolean => {
  if (!t) return true;
  const lens = [
    t.base?.length ?? 0,
    t.reinforcements?.length ?? 0,
    t.prelight?.length ?? 0,
    t.pickup?.length ?? 0,
  ];
  return lens.every(n => n === 0);
};

export const validateTeamNames = (team: ProjectTeam | undefined): { role: string; group: string } | null => {
  if (!team) return null;
  
  const groups = [
    { name: 'base', members: team.base || [] },
    { name: 'refuerzos', members: team.reinforcements || [] },
    { name: 'prelight', members: team.prelight || [] },
    { name: 'recogida', members: team.pickup || [] },
  ];

  for (const group of groups) {
    for (const member of group.members) {
      if (!member.name || member.name.trim() === '') {
        return { role: member.role || 'Sin rol', group: group.name };
      }
    }
  }
  
  return null;
};

export const formatMode = (m: string | undefined): string => {
  const v = String(m || '').toLowerCase();
  if (v === 'mensual') return 'mensuales';
  if (v === 'publicidad') return 'publicidad';
  return 'semanales'; // por defecto
};

