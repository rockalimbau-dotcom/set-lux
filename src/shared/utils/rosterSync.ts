interface TeamMember {
  personId?: string;
  role?: string;
  roleId?: string;
  roleLabel?: string;
  name?: string;
  source?: string;
  gender?: 'male' | 'female' | 'neutral';
  rosterManaged?: boolean;
  [key: string]: any;
}

const normalizeRole = (role: unknown): string => String(role || '').trim().toUpperCase();
const roleIdentity = (member: Pick<TeamMember, 'role' | 'roleId'> | undefined): string =>
  String(member?.roleId || member?.role || '').trim().toUpperCase();

const indexRoster = (
  list: TeamMember[]
): Map<string, { name: string; gender?: 'male' | 'female' | 'neutral'; personId?: string; roleId?: string; roleLabel?: string }[]> => {
  const map = new Map<string, { name: string; gender?: 'male' | 'female' | 'neutral'; personId?: string; roleId?: string; roleLabel?: string }[]>();
  (list || []).forEach(m => {
    const role = normalizeRole(m?.role);
    if (!m || !role) return;
    const arr = map.get(role) || [];
    arr.push({
      name: m.name || '',
      gender: (m as any).gender,
      personId: m.personId,
      roleId: m.roleId,
      roleLabel: m.roleLabel,
    });
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

const findBestPosition = (
  dayList: TeamMember[],
  positions: number[],
  used: Set<number>,
  rosterEntry: { personId?: string; roleId?: string; name?: string }
): number | null => {
  const rosterPersonId = String(rosterEntry?.personId || '').trim();
  const rosterRoleId = String(rosterEntry?.roleId || '').trim();
  const exactRoleId = positions.find(pos => !used.has(pos) && roleIdentity(dayList[pos]) === String(rosterEntry?.roleId || '').trim().toUpperCase());
  if (exactRoleId != null) return exactRoleId;

  const exactPersonId = rosterPersonId
    ? positions.find(pos => {
        if (used.has(pos)) return false;
        if (String(dayList[pos]?.personId || '').trim() !== rosterPersonId) return false;
        const slotRoleId = String(dayList[pos]?.roleId || '').trim();
        if (slotRoleId && rosterRoleId && slotRoleId !== rosterRoleId) return false;
        return true;
      })
    : undefined;
  if (exactPersonId != null) return exactPersonId;

  const blankPersonId = positions.find(pos => !used.has(pos) && !String(dayList[pos]?.personId || '').trim());
  if (blankPersonId != null && rosterPersonId) return blankPersonId;

  const blankRoleId = positions.find(pos => !used.has(pos) && !String(dayList[pos]?.roleId || '').trim());
  if (blankRoleId != null) return blankRoleId;

  const exactName = positions.find(
    pos => {
      if (used.has(pos)) return false;
      if (String(dayList[pos]?.name || '').trim() !== String(rosterEntry?.name || '').trim()) return false;
      const slotRoleId = String(dayList[pos]?.roleId || '').trim();
      if (slotRoleId && rosterRoleId && slotRoleId !== rosterRoleId) return false;
      return true;
    }
  );
  if (exactName != null) return exactName;

  const hasConflictingTariffPosition = positions.some(pos => {
    if (used.has(pos)) return false;
    const slotRoleId = String(dayList[pos]?.roleId || '').trim();
    if (!slotRoleId || !rosterRoleId || slotRoleId === rosterRoleId) return false;
    const samePersonId =
      rosterPersonId &&
      String(dayList[pos]?.personId || '').trim() === rosterPersonId;
    const sameName =
      String(dayList[pos]?.name || '').trim() === String(rosterEntry?.name || '').trim();
    return samePersonId || sameName;
  });
  if (hasConflictingTariffPosition) return null;

  const firstFree = positions.find(pos => !used.has(pos));
  return firstFree != null ? firstFree : null;
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
    const usedPositions = new Set<number>();
    for (let i = 0; i < names.length && i < pos.length; i++) {
      const at = findBestPosition(out, pos, usedPositions, names[i]);
      if (at == null) continue;
      usedPositions.add(at);
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
          personId: names[i]?.personId ?? out[at]?.personId,
          roleId: names[i]?.roleId ?? out[at]?.roleId,
          roleLabel: names[i]?.roleLabel ?? out[at]?.roleLabel,
          source: curSource || fallbackSource,
          rosterManaged: true,
        };
        continue;
      }

      // 2) Actualizar campos derivados del roster cuando el nombre coincide
      if (
        curName === targetName &&
        (
          out[at]?.gender !== targetGender ||
          out[at]?.personId !== names[i]?.personId ||
          out[at]?.roleId !== names[i]?.roleId ||
          out[at]?.roleLabel !== names[i]?.roleLabel
        )
      ) {
        out[at] = {
          ...out[at],
          gender: targetGender,
          personId: names[i]?.personId ?? out[at]?.personId,
          roleId: names[i]?.roleId ?? out[at]?.roleId,
          roleLabel: names[i]?.roleLabel ?? out[at]?.roleLabel,
        };
      }
    }
  }
  return out;
};
