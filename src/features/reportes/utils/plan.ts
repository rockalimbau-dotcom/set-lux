// Utils specific to planning access used by ReportesSemana
import { norm } from './text';
import { hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';
import { getExtraBlockByIndex } from './extra';

export const BLOCKS = { base: 'base', pre: 'pre', pick: 'pick', extra: 'extra' } as const;

export const isMemberRefuerzo = (m: any): boolean => {
  const r = String(m?.role || '');
  const n = String(m?.name || '');
  return m?.refuerzo === true || /ref/i.test(r) || /ref/i.test(n);
};

interface WeekAndDay {
  day: any;
}

const DAY_BLOCK_KEYS = {
  [BLOCKS.base]: ['crewList', 'team'],
  [BLOCKS.pre]: ['preList', 'prelight'],
  [BLOCKS.pick]: ['pickList', 'pickup'],
  [BLOCKS.extra]: ['refList'],
} as const;

const readFirstArray = (day: any, keys: readonly string[]) => {
  for (const key of keys) {
    if (Array.isArray(day?.[key])) return day[key];
  }
  return [];
};

export function getDayBlockList(day: any, block: string): any[] {
  if (!day) return [];

  if (block === BLOCKS.base) {
    const crewList = readFirstArray(day, DAY_BLOCK_KEYS[BLOCKS.base]);
    if (Array.isArray(day?.crewList)) return crewList;
    return crewList.filter(member => !isMemberRefuerzo(member));
  }

  if (block === BLOCKS.extra) {
    if (Array.isArray(day?.refList)) return day.refList;
    const team = Array.isArray(day?.team) ? day.team : [];
    return team.filter(member => isMemberRefuerzo(member));
  }

  if (typeof block === 'string' && block.startsWith('extra:')) {
    const index = Number(block.split(':')[1] || '-1');
    if (!Number.isFinite(index) || index < 0) return [];
    const extraBlock = getExtraBlockByIndex(day, index);
    return Array.isArray(extraBlock?.list) ? extraBlock.list : [];
  }

  if (block === BLOCKS.pre) return readFirstArray(day, DAY_BLOCK_KEYS[BLOCKS.pre]);
  if (block === BLOCKS.pick) return readFirstArray(day, DAY_BLOCK_KEYS[BLOCKS.pick]);

  return [];
}

export function refWorksOnBlock(
  findWeekAndDay: (iso: string) => WeekAndDay, 
  iso: string, 
  name: string, 
  block: string
): boolean {
  const { day } = findWeekAndDay(iso);
  if (!day || (day.tipo || '') === 'Descanso') return false;
  const any = (arr: any[]) =>
    (arr || []).some(m => norm(m?.name) === norm(name) && isMemberRefuerzo(m));
  return any(getDayBlockList(day, block || BLOCKS.base));
}

export function isPersonScheduledOnBlock(
  iso: string,
  roleLabel: string,
  name: string,
  findWeekAndDayFn: (iso: string) => WeekAndDay,
  blockForRef?: string,
  options?: { roleId?: string }
): boolean {
  const { day } = findWeekAndDayFn(iso);
  if (!day || day.tipo === 'Descanso') return false;
  const roleId = String(options?.roleId || '').trim();

  const block = blockForRef
    || (hasRoleGroupSuffix(String(roleLabel || '')) && /P$/i.test(String(roleLabel || ''))
      ? BLOCKS.pre
      : hasRoleGroupSuffix(String(roleLabel || '')) && /R$/i.test(String(roleLabel || ''))
      ? BLOCKS.pick
      : BLOCKS.base);
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
  const roleStr = String(roleLabel || '');
  if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
    return refWorksOnBlock(findWeekAndDayFn, iso, name, block);
  }

  const baseRole = stripRoleSuffix(String(roleLabel || ''));
  const list: Array<{ name?: string; role?: string }> = getDayBlockList(day, block);
  return list.some(
    (m: { name?: string; role?: string }) => {
      const memberRoleId = String((m as any)?.roleId || '').trim();
      const memberRole = String(m?.role || '');
      const normMemberBase = norm(stripRoleSuffix(memberRole));
      const normBase = norm(stripRoleSuffix(baseRole));
      return (
        norm(m?.name) === norm(name) &&
        (
          (roleId
            ? (memberRoleId ? memberRoleId === roleId : false)
            :
          !memberRole ||
          normMemberBase === normBase ||
          !baseRole)
        )
      );
    }
  );
}

export function blockKeyForPerson(
  iso: string, 
  roleLabel: string, 
  name: string, 
  findWeekAndDayFn: (iso: string) => WeekAndDay
): string {
  const r = String(roleLabel || '');
  if (r === 'REF') {
    if (
      isPersonScheduledOnBlock(iso, 'REF', name, findWeekAndDayFn, BLOCKS.pre)
    )
      return 'pre';
    if (
      isPersonScheduledOnBlock(iso, 'REF', name, findWeekAndDayFn, BLOCKS.pick)
    )
      return 'pick';
    if (
      isPersonScheduledOnBlock(iso, 'REF', name, findWeekAndDayFn, BLOCKS.extra)
    )
      return 'extra';
    return 'base';
  }
  if (hasRoleGroupSuffix(r) && /P$/i.test(r)) return 'pre';
  if (hasRoleGroupSuffix(r) && /R$/i.test(r)) return 'pick';
  return 'base';
}

// Factory to create findWeekAndDay using host's getPlanAllWeeks + date helpers
export function findWeekAndDayFactory(
  getPlanAllWeeks: () => { pre?: any[]; pro?: any[] }, 
  mondayOf: (date: Date) => Date, 
  toYYYYMMDD: (date: Date) => string
) {
  return function findWeekAndDay(iso: string): { week: any; day: any; idx: number } {
    try {
      const { pre, pro } = getPlanAllWeeks();
      const weeks = [...(pre || []), ...(pro || [])];
      const [y, m, d] = iso.split('-').map(Number);
      const monday = toYYYYMMDD(mondayOf(new Date(y, m - 1, d)));
      const week = weeks.find((w: any) => w.startDate === monday);
      if (!week) return { week: null, day: null, idx: -1 };
      const js = new Date(y, m - 1, d).getDay();
      const idx = (js + 6) % 7;
      const day = week.days?.[idx] || null;
      return { week, day, idx };
    } catch {
      return { week: null, day: null, idx: -1 };
    }
  };
}

// --- Additional helpers moved from ReportesSemana ---
export function personWorksOn(
  findWeekAndDay: (iso: string) => WeekAndDay, 
  iso: string, 
  roleLabel: string, 
  personName: string,
  options?: { roleId?: string }
): boolean {
  const { day } = findWeekAndDay(iso);
  if (!day || (day.tipo || '') === 'Descanso') return false;
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
  const roleStr = String(roleLabel || '');
  if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
    return (
      refWorksOnBlock(findWeekAndDay, iso, personName, BLOCKS.base) ||
      refWorksOnBlock(findWeekAndDay, iso, personName, BLOCKS.pre) ||
      refWorksOnBlock(findWeekAndDay, iso, personName, BLOCKS.pick) ||
      refWorksOnBlock(findWeekAndDay, iso, personName, BLOCKS.extra)
    );
  }
  const suffix = hasRoleGroupSuffix(roleLabel) ? (/P$/i.test(roleLabel) ? 'P' : 'R') : '';
  const baseRole = stripRoleSuffix(String(roleLabel || ''));
  const list =
    suffix === 'P'
      ? getDayBlockList(day, BLOCKS.pre)
      : suffix === 'R'
      ? getDayBlockList(day, BLOCKS.pick)
      : getDayBlockList(day, BLOCKS.base);
  return (list || []).some(
    (m: { name?: string; role?: string }) => {
      const memberRoleId = String((m as any)?.roleId || '').trim();
      const memberRole = String(m?.role || '');
      const normMemberBase = norm(stripRoleSuffix(memberRole));
      const normBase = norm(stripRoleSuffix(baseRole));
      return (
        norm(m?.name) === norm(personName) &&
        (
          (options?.roleId
            ? (memberRoleId ? memberRoleId === String(options.roleId).trim() : false)
            :
          !memberRole ||
          normMemberBase === normBase ||
          !baseRole)
        )
      );
    }
  );
}

export function isOffForPerson(
  findWeekAndDay: (iso: string) => WeekAndDay, 
  iso: string, 
  roleLabel: string, 
  personName: string,
  options?: { roleId?: string }
): boolean {
  const { day } = findWeekAndDay(iso);
  if (!day) return true;
  if ((day.tipo || '') === 'Descanso') return true;
  return !personWorksOn(findWeekAndDay, iso, roleLabel, personName, options);
}
