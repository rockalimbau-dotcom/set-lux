// Utils specific to planning access used by ReportesSemana
import { norm } from './text';
import { hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';

export const BLOCKS = { base: 'base', pre: 'pre', pick: 'pick', extra: 'extra' } as const;

export const isMemberRefuerzo = (m: any): boolean => {
  const r = String(m?.role || '');
  const n = String(m?.name || '');
  return m?.refuerzo === true || /ref/i.test(r) || /ref/i.test(n);
};

interface WeekAndDay {
  day: any;
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
  if (block === BLOCKS.pre) return any(day.prelight);
  if (block === BLOCKS.pick) return any(day.pickup);
  if (block === BLOCKS.extra) return any(day.refList);
  return any(day.team); // base
}

export function isPersonScheduledOnBlock(
  iso: string,
  roleLabel: string,
  name: string,
  findWeekAndDayFn: (iso: string) => WeekAndDay,
  blockForRef?: string
): boolean {
  const { day } = findWeekAndDayFn(iso);
  if (!day || day.tipo === 'Descanso') return false;

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
  const suffix =
    block === BLOCKS.pre
      ? 'prelight'
      : block === BLOCKS.pick
      ? 'pickup'
      : block === BLOCKS.extra
      ? 'refList'
      : 'team';
  const list: Array<{ name?: string; role?: string }> = Array.isArray((day as any)[suffix]) ? (day as any)[suffix] : [];
  return list.some(
    (m: { name?: string; role?: string }) => {
      const memberRole = String(m?.role || '');
      const normMemberBase = norm(stripRoleSuffix(memberRole));
      const normBase = norm(stripRoleSuffix(baseRole));
      return (
        norm(m?.name) === norm(name) &&
        (!memberRole || normMemberBase === normBase || !baseRole)
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
  personName: string
): boolean {
  const { day } = findWeekAndDay(iso);
  if (!day || (day.tipo || '') === 'Descanso') return false;
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
  const roleStr = String(roleLabel || '');
  if (roleStr === 'REF' || (roleStr.startsWith('REF') && roleStr.length > 3)) {
    const any = (arr: any[]) =>
      (arr || []).some(
        m => (m.name || '') === (personName || '') && isMemberRefuerzo(m)
      );
    return any(day.team) || any(day.prelight) || any(day.pickup);
  }
  const suffix = hasRoleGroupSuffix(roleLabel) ? (/P$/i.test(roleLabel) ? 'P' : 'R') : '';
  const baseRole = stripRoleSuffix(String(roleLabel || ''));
  const list =
    suffix === 'P' ? day.prelight : suffix === 'R' ? day.pickup : day.team;
  return (list || []).some(
    (m: { name?: string; role?: string }) => {
      const memberRole = String(m?.role || '');
      const normMemberBase = norm(stripRoleSuffix(memberRole));
      const normBase = norm(stripRoleSuffix(baseRole));
      return (
        norm(m?.name) === norm(personName) &&
        (!memberRole || normMemberBase === normBase || !baseRole)
      );
    }
  );
}

export function isOffForPerson(
  findWeekAndDay: (iso: string) => WeekAndDay, 
  iso: string, 
  roleLabel: string, 
  personName: string
): boolean {
  const { day } = findWeekAndDay(iso);
  if (!day) return true;
  if ((day.tipo || '') === 'Descanso') return true;
  return !personWorksOn(findWeekAndDay, iso, roleLabel, personName);
}
