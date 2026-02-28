interface TeamMember {
  role?: string;
  name?: string;
  source?: string;
  [key: string]: any;
}

const indexRoster = (
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

const positionsOfRole = (dayList: TeamMember[], role: string): number[] => {
  const idxs: number[] = [];
  (dayList || []).forEach((m, i) => {
    if (m?.role === role) idxs.push(i);
  });
  return idxs;
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
      const curSource = (out[at]?.source || fallbackSource) as string;

      // 1) Rellenar huecos en blanco a partir del equipo
      if (curName === '' && targetName !== '') {
        out[at] = {
          ...out[at],
          name: targetName,
          gender: targetGender,
          source: curSource || fallbackSource,
        };
        continue;
      }

      // 2) Mantener sincronizados los nombres auto‑gestionados por el roster
      //    (mismas posiciones de rol cuya source coincide con fallbackSource)
      if (curSource === fallbackSource && targetName !== '' && curName !== targetName) {
        out[at] = {
          ...out[at],
          name: targetName,
          gender: targetGender,
          source: curSource,
        };
        continue;
      }

      // 3) Actualizar solo el género cuando el nombre coincide
      if (curName === targetName && out[at]?.gender !== targetGender) {
        out[at] = {
          ...out[at],
          gender: targetGender,
        };
      }
    }
  }
  return out;
};
