interface TeamMember {
  role?: string;
  name?: string;
  source?: string;
  rosterManaged?: boolean;
  [key: string]: any;
}

const normalizeRole = (role: unknown): string => String(role || '').trim().toUpperCase();

const indexRoster = (
  list: TeamMember[]
): Map<string, { name: string; gender?: 'male' | 'female' | 'neutral' }[]> => {
  const map = new Map<string, { name: string; gender?: 'male' | 'female' | 'neutral' }[]>();
  (list || []).forEach(m => {
    const role = normalizeRole(m?.role);
    if (!m || !role) return;
    const arr = map.get(role) || [];
    arr.push({ name: m.name || '', gender: (m as any).gender });
    map.set(role, arr);
  });
  return map;
};

const positionsOfRole = (dayList: TeamMember[], role: string): number[] => {
  const idxs: number[] = [];
  (dayList || []).forEach((m, i) => {
    if (normalizeRole(m?.role) === role) idxs.push(i);
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
    const validNamesForRole = new Set(
      names.map(item => String(item?.name || '').trim()).filter(Boolean)
    );
    for (let i = 0; i < names.length && i < pos.length; i++) {
      const at = pos[i];
      const targetName = names[i]?.name || '';
      const targetGender = names[i]?.gender;
      const curName = (out[at]?.name || '').trim();
      const curSource = (out[at]?.source || fallbackSource) as string;
      const isRosterManaged = out[at]?.rosterManaged !== false;

      // 1) Rellenar huecos en blanco a partir del equipo
      if (curName === '' && targetName !== '') {
        out[at] = {
          ...out[at],
          name: targetName,
          gender: targetGender,
          source: curSource || fallbackSource,
          rosterManaged: true,
        };
        continue;
      }

      // 2) Mantener sincronizados los nombres heredados del roster
      if (
        targetName !== '' &&
        curName !== targetName &&
        (isRosterManaged || !validNamesForRole.has(curName))
      ) {
        out[at] = {
          ...out[at],
          name: targetName,
          gender: targetGender,
          source: curSource || fallbackSource,
          rosterManaged: true,
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
