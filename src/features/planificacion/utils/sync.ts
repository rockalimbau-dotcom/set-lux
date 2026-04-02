// Jerarquía completa de roles para planificación
const rolePriority = (role: string = ''): number => {
  const r = String(role).toUpperCase().trim();
  
  // EQUIPO BASE
  if (r === 'G') return 0;
  if (r === 'BB') return 1;
  if (r === 'E') return 2;
  if (r === 'TM') return 3;
  if (r === 'FB') return 4;
  if (r === 'AUX') return 5;
  if (r === 'M') return 6;
  
  // REFUERZOS
  if (r === 'REF') return 7;
  
  // EQUIPO PRELIGHT
  if (r === 'GP') return 8;
  if (r === 'BBP') return 9;
  if (r === 'EP') return 10;
  if (r === 'TMP') return 11;
  if (r === 'FBP') return 12;
  if (r === 'AUXP') return 13;
  if (r === 'MP') return 14;
  
  // EQUIPO RECOGIDA
  if (r === 'GR') return 15;
  if (r === 'BBR') return 16;
  if (r === 'ER') return 17;
  if (r === 'TMR') return 18;
  if (r === 'FBR') return 19;
  if (r === 'AUXR') return 20;
  if (r === 'MR') return 21;
  
  // Roles desconocidos al final
  return 1000;
};

interface TeamMember {
  personId?: string;
  role?: string;
  roleId?: string;
  roleLabel?: string;
  name?: string;
  source?: string;
  [key: string]: any;
}

interface Day {
  tipo?: string;
  team?: TeamMember[];
  prelight?: TeamMember[];
  pickup?: TeamMember[];
  start?: string;
  end?: string;
  cut?: string;
  loc?: string;
  prelightStart?: string;
  prelightEnd?: string;
  pickupStart?: string;
  pickupEnd?: string;
  [key: string]: any;
}

interface Week {
  days?: Day[];
  [key: string]: any;
}

export const sortByHierarchy = (list: TeamMember[] = []): TeamMember[] =>
  list
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => {
      const pa = rolePriority(a.it?.role);
      const pb = rolePriority(b.it?.role);
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    })
    .map(({ it }) => it);

const rosterIdentity = (member: TeamMember | null | undefined): string =>
  String(member?.roleId || member?.role || '').trim();

export const indexRoster = (list: TeamMember[]): Map<string, TeamMember[]> => {
  const map = new Map<string, TeamMember[]>();
  (list || []).forEach(m => {
    const key = rosterIdentity(m);
    if (!m || !key) return;
    const arr = map.get(key) || [];
    arr.push({
      ...m,
      name: m.name || '',
    });
    map.set(key, arr);
  });
  return map;
};

export const positionsOfRole = (dayList: TeamMember[], role: string): number[] => {
  const idxs: number[] = [];
  (dayList || []).forEach((m, i) => {
    if (rosterIdentity(m) === String(role || '').trim()) idxs.push(i);
  });
  return idxs;
};

export const syncDayListWithRoster = (dayList: TeamMember[], rosterList: TeamMember[]): TeamMember[] => {
  const out = Array.isArray(dayList) ? [...dayList] : [];
  const rosterIdx = indexRoster(rosterList);
  for (const [roleKey, rosterMembers] of rosterIdx.entries()) {
    const pos = positionsOfRole(out, roleKey);
    for (let i = 0; i < rosterMembers.length; i++) {
      const rosterMember = rosterMembers[i] || {};
      const targetName = rosterMember.name || '';
      if (i < pos.length) {
        const at = pos[i];
        if (out[at]?.name !== targetName) {
          out[at] = {
            ...out[at],
            name: targetName,
            personId: out[at].personId || rosterMember.personId,
            role: out[at].role || rosterMember.role,
            roleId: out[at].roleId || rosterMember.roleId,
            roleLabel: out[at].roleLabel || rosterMember.roleLabel,
            gender: out[at].gender || rosterMember.gender,
            source: out[at].source || 'base',
          };
        }
      } else {
        out.push({
          ...rosterMember,
          personId: rosterMember.personId,
          role: rosterMember.role,
          roleId: rosterMember.roleId,
          roleLabel: rosterMember.roleLabel,
          name: targetName,
          source: rosterMember.source || 'base',
        });
      }
    }
  }
  return out;
};

export const syncDayListWithRosterBlankOnly = (
  dayList: TeamMember[],
  rosterList: TeamMember[],
  fallbackSource: string
): TeamMember[] => {
  const out = Array.isArray(dayList) ? [...dayList] : [];
  const rosterIdx = indexRoster(rosterList);
  for (const [roleKey, rosterMembers] of rosterIdx.entries()) {
    const pos = positionsOfRole(out, roleKey);
    for (let i = 0; i < rosterMembers.length && i < pos.length; i++) {
      const at = pos[i];
      const rosterMember = rosterMembers[i] || {};
      const targetName = rosterMember.name || '';
      const curName = (out[at]?.name || '').trim();
      if (curName === '' && targetName !== '') {
        out[at] = {
          ...out[at],
          name: targetName,
          personId: out[at].personId || rosterMember.personId,
          role: out[at].role || rosterMember.role,
          roleId: out[at].roleId || rosterMember.roleId,
          roleLabel: out[at].roleLabel || rosterMember.roleLabel,
          gender: out[at].gender || rosterMember.gender,
          source: out[at].source || fallbackSource,
        };
      }
    }
  }
  return out;
};

export const syncAllWeeks = (
  weeks: Week[], 
  base: TeamMember[], 
  pre: TeamMember[], 
  pick: TeamMember[], 
  refs: TeamMember[]
): Week[] => {
  return (weeks || []).map(w => ({
    ...w,
    days: (w.days || []).map(d => {
      if (d.tipo === 'Descanso') {
        return {
          ...d,
          team: [],
          prelight: [],
          pickup: [],
          start: '',
          end: '',
          cut: '',
          loc: 'DESCANSO',
          prelightStart: '',
          prelightEnd: '',
          pickupStart: '',
          pickupEnd: '',
        };
      }

      let nextTeam: TeamMember[];
      if (!d.team || d.team.length === 0) {
        nextTeam = (base || []).map(m => ({
          ...m,
          personId: m.personId,
          role: m.role,
          roleId: m.roleId,
          roleLabel: m.roleLabel,
          name: m.name || '',
          source: m.source || 'base',
        }));
      } else {
        const followRoster = Boolean((w as any)?.followRoster);
        nextTeam = followRoster
          ? syncDayListWithRoster(d.team as any, base as any)
          : syncDayListWithRosterBlankOnly(d.team, base, 'base');
        nextTeam = nextTeam.map(t => ({ ...t, source: t.source || 'base' }));
      }

      const nextPre = syncDayListWithRosterBlankOnly(d.prelight, pre, 'pre');
      const nextPick = syncDayListWithRosterBlankOnly(d.pickup, pick, 'pick');

      const syncRefs = (lst: TeamMember[]): TeamMember[] => {
        const out = [...(lst || [])];
        const refPeople = refs || [];
        const refPos = positionsOfRole(out, 'REF');
        for (let i = 0; i < refPos.length && i < refPeople.length; i++) {
          const at = refPos[i];
          const curName = (out[at]?.name || '').trim();
          if (curName === '' && refPeople[i]?.name) {
            out[at] = {
              ...out[at],
              name: refPeople[i].name,
              personId: out[at].personId || refPeople[i].personId,
              roleId: out[at].roleId || refPeople[i].roleId,
              roleLabel: out[at].roleLabel || refPeople[i].roleLabel,
              gender: out[at].gender || refPeople[i].gender,
            };
          }
        }
        return out;
      };

      return {
        ...d,
        team: syncRefs(nextTeam),
        prelight: syncRefs(nextPre),
        pickup: syncRefs(nextPick),
      };
    }),
  }));
};
