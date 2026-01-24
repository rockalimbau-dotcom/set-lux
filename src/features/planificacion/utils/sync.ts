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
  if (r === 'RG') return 7;
  if (r === 'RBB') return 8;
  if (r === 'RE') return 9;
  if (r === 'RIG') return 9;
  if (r === 'TG') return 10;
  if (r === 'EPO') return 11;
  if (r === 'TP') return 12;
  
  // REFUERZOS (REF, REFG, REFBB, REFE, REFRIG, etc.)
  if (r === 'REF' || (r.startsWith('REF') && r.length > 3)) return 14;
  
  // EQUIPO PRELIGHT
  if (r === 'GP') return 15;
  if (r === 'BBP') return 16;
  if (r === 'EP') return 17;
  if (r === 'TMP') return 18;
  if (r === 'FBP') return 19;
  if (r === 'AUXP') return 20;
  if (r === 'MP') return 21;
  if (r === 'RGP') return 22;
  if (r === 'RBBP') return 23;
  if (r === 'REP') return 24;
  if (r === 'TGP') return 25;
  if (r === 'EPOP') return 26;
  if (r === 'TPP') return 27;
  if (r === 'RIGP') return 28;
  
  // EQUIPO RECOGIDA
  if (r === 'GR') return 29;
  if (r === 'BBR') return 30;
  if (r === 'ER') return 31;
  if (r === 'TMR') return 32;
  if (r === 'FBR') return 33;
  if (r === 'AUXR') return 34;
  if (r === 'MR') return 35;
  if (r === 'RGR') return 36;
  if (r === 'RBBR') return 37;
  if (r === 'RER') return 38;
  if (r === 'TGR') return 39;
  if (r === 'EPOR') return 40;
  if (r === 'TPR') return 41;
  if (r === 'RIGR') return 42;
  
  // Roles desconocidos al final
  return 1000;
};

interface TeamMember {
  role?: string;
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

export const indexRoster = (
  list: TeamMember[]
): Map<string, { name: string; gender?: 'male' | 'female' | 'neutral' }[]> => {
  const map = new Map<string, { name: string; gender?: 'male' | 'female' | 'neutral' }[]>();
  (list || []).forEach(m => {
    if (!m || !m.role) return;
    const arr = map.get(m.role) || [];
    arr.push({ name: m.name || '', gender: (m as any).gender });
    map.set(m.role, arr);
  });
  return map;
};

export const positionsOfRole = (dayList: TeamMember[], role: string): number[] => {
  const idxs: number[] = [];
  (dayList || []).forEach((m, i) => {
    if (m?.role === role) idxs.push(i);
  });
  return idxs;
};

export const syncDayListWithRoster = (dayList: TeamMember[], rosterList: TeamMember[]): TeamMember[] => {
  const out = Array.isArray(dayList) ? [...dayList] : [];
  const rosterIdx = indexRoster(rosterList);
  for (const [role, names] of rosterIdx.entries()) {
    const pos = positionsOfRole(out, role);
    for (let i = 0; i < names.length; i++) {
      const targetName = names[i]?.name || '';
      const targetGender = names[i]?.gender;
      if (i < pos.length) {
        const at = pos[i];
        if (out[at]?.name !== targetName || out[at]?.gender !== targetGender) {
          out[at] = {
            ...out[at],
            name: targetName,
            gender: targetGender,
            source: out[at].source || 'base',
          };
        }
      } else {
        out.push({ role, name: targetName, gender: targetGender, source: 'base' });
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
  for (const [role, names] of rosterIdx.entries()) {
    const pos = positionsOfRole(out, role);
    for (let i = 0; i < names.length && i < pos.length; i++) {
      const at = pos[i];
      const targetName = names[i]?.name || '';
      const targetGender = names[i]?.gender;
      const curName = (out[at]?.name || '').trim();
      if (curName === '' && targetName !== '') {
        out[at] = {
          ...out[at],
          name: targetName,
          gender: targetGender,
          source: out[at].source || fallbackSource,
        };
      } else if (curName === targetName && out[at]?.gender !== targetGender) {
        out[at] = {
          ...out[at],
          gender: targetGender,
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
          role: m.role,
          name: m.name || '',
          gender: (m as any).gender,
          source: 'base',
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
        const refNames = (refs || []).map(r => r.name || '');
        const refByName = new Map<string, TeamMember>();
        (refs || []).forEach(r => {
          if (r?.name) refByName.set(r.name, r);
        });
        // Buscar posiciones de todos los roles que empiezan con REF (REF, REFG, REFBB, etc.)
        const refPos: number[] = [];
        (out || []).forEach((m, i) => {
          const role = String(m?.role || '');
          if (role === 'REF' || (role.startsWith('REF') && role.length > 3)) {
            refPos.push(i);
          }
        });
        for (let i = 0; i < refPos.length && i < refNames.length; i++) {
          const at = refPos[i];
          const curName = (out[at]?.name || '').trim();
          if (curName === '' && refNames[i]) {
            const refData = refByName.get(refNames[i]);
            out[at] = {
              ...out[at],
              name: refNames[i],
              gender: (refData as any)?.gender,
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
