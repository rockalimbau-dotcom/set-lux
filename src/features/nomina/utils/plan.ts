import { useMemo } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD, toYYYYMMDD, addDays } from '@shared/utils/date';
import { stripRoleSuffix } from '@shared/constants/roles';

export function usePlanWeeks(project: { id?: string; nombre?: string } | null) {
  const storageKey = useMemo(() => {
    const base = project?.id || project?.nombre || 'demo';
    return `plan_${base}`;
  }, [project?.id, project?.nombre]);

  return useMemo(() => {
    try {
      const data = storage.getJSON<any>(storageKey) || {};
      return {
        pre: Array.isArray(data.pre) ? data.pre : [],
        pro: Array.isArray(data.pro) ? data.pro : [],
      } as { pre: any[]; pro: any[] };
    } catch {
      return { pre: [], pro: [] } as { pre: any[]; pro: any[] };
    }
  }, [storageKey]);
}

export const stripPR = (r: string): string => {
  let role = String(r || '');
  // Quitar prefijo REF si existe (REFG -> G, REFBB -> BB, etc.)
  if (role.startsWith('REF') && role.length > 3) {
    role = role.substring(3);
  }
  return stripRoleSuffix(role);
};

export function isMemberRefuerzo(m: { role?: string; name?: string; refuerzo?: boolean } | null) {
  const r = String(m?.role || '');
  const n = String(m?.name || '');
  return !!(m?.refuerzo === true || /ref/i.test(r) || /ref/i.test(n));
}

export function buildRefuerzoIndex(weeks: any[]): Set<string> {
  const set = new Set<string>();
  for (const w of weeks || []) {
    for (const d of w?.days || []) {
      const mark = (m: any) => {
        if (!m) return;
        if (isMemberRefuerzo(m)) {
          const roleBase = stripPR(m.role || '');
          const key = `${roleBase}__${m.name || ''}`;
          set.add(key);
        }
      };
      (d?.team || []).forEach((m: any) => mark(m));
      (d?.prelight || []).forEach((m: any) => mark(m));
      (d?.pickup || []).forEach((m: any) => mark(m));
    }
  }
  return set;
}

export function weekISOdays(week: { startDate: string }): string[] {
  const start = parseYYYYMMDD(week.startDate);
  return Array.from({ length: 7 }, (_, i) => toYYYYMMDD(addDays(start, i)));
}

export function weekAllPeopleActive(week: any): { role: string; name: string; gender?: 'male' | 'female' | 'neutral' }[] {
  const seen = new Set<string>();
  const out: { role: string; name: string; gender?: 'male' | 'female' | 'neutral' }[] = [];
  const push = (role?: string, name?: string, gender?: 'male' | 'female' | 'neutral') => {
    if (!role && !name) return;
    // Generar nombre por defecto si no hay nombre
    const finalName = name || `Persona_${role || 'UNKNOWN'}`;
    const id = `${role || ''}__${finalName}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ role: role || '', name: finalName, gender });
  };

  for (const d of week?.days || []) {
    for (const m of d?.team || []) push(m.role || '', m.name || '', m.gender);
    for (const m of d?.prelight || []) push(m.role || '', m.name || '', m.gender);
    for (const m of d?.pickup || []) push(m.role || '', m.name || '', m.gender);
  }
  return out;
}


