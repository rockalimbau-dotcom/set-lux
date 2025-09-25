// Utils specific to planning access used by ReportesSemana
import { norm } from './text';

export const BLOCKS = { base: 'base', pre: 'pre', pick: 'pick' } as const;

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

  if (String(roleLabel || '') === 'REF' && blockForRef) {
    return refWorksOnBlock(findWeekAndDayFn, iso, name, blockForRef);
  }

  const baseRole = String(roleLabel || '').replace(/[PR]$/, '');
  const suffix = /P$/.test(roleLabel || '')
    ? 'prelight'
    : /R$/.test(roleLabel || '')
      ? 'pickup'
      : 'team';
  const list = Array.isArray(day[suffix]) ? day[suffix] : [];
  return list.some(
    m =>
      norm(m?.name) === norm(name) &&
      (!m?.role || norm(m?.role) === norm(baseRole) || !baseRole)
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
    return 'base';
  }
  if (/P$/.test(r)) return 'pre';
  if (/R$/.test(r)) return 'pick';
  return 'base';
}

// Factory to create findWeekAndDay using host's getPlanAllWeeks + date helpers
export function findWeekAndDayFactory(
  getPlanAllWeeks: () => { pre?: any[]; pro?: any[] }, 
  mondayOf: (date: Date) => Date, 
  toISO: (date: Date) => string
) {
  return function findWeekAndDay(iso: string): { week: any; day: any; idx: number } {
    try {
      const { pre, pro } = getPlanAllWeeks();
      const weeks = [...(pre || []), ...(pro || [])];
      const [y, m, d] = iso.split('-').map(Number);
      const monday = toISO(mondayOf(new Date(y, m - 1, d)));
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
  if (String(roleLabel || '') === 'REF') {
    const any = (arr: any[]) =>
      (arr || []).some(
        m => (m.name || '') === (personName || '') && isMemberRefuerzo(m)
      );
    return any(day.team) || any(day.prelight) || any(day.pickup);
  }
  const suffix = /P$/.test(roleLabel) ? 'P' : /R$/.test(roleLabel) ? 'R' : '';
  const baseRole = String(roleLabel || '').replace(/[PR]$/, '');
  const list =
    suffix === 'P' ? day.prelight : suffix === 'R' ? day.pickup : day.team;
  return (list || []).some(
    m =>
      norm(m?.name) === norm(personName) &&
      (!m?.role || norm(m?.role) === norm(baseRole) || !baseRole)
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
