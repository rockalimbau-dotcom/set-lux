import { parseYYYYMMDD, toYYYYMMDD, addDays } from '@shared/utils/date';
import { AnyRecord } from '@shared/types/common';
import {
  hasRoleGroupSuffix,
  stripRefuerzoSuffix,
  stripRoleSuffix,
} from '@shared/constants/roles';
import { personaKey } from '../../utils/model';

/**
 * Convert a planning week to array of 7 ISO days
 */
export function weekToSemanasISO(week: AnyRecord): string[] {
  const start = parseYYYYMMDD(week.startDate as string);
  return Array.from({ length: 7 }, (_, i) => toYYYYMMDD(addDays(start, i)));
}

/**
 * Union of people from the 7 days (uses the same shape that ReportesSemana understands)
 */
export function weekToPersonas(week: AnyRecord): AnyRecord[] {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  const SOURCES = [
    { key: 'team', suffix: '', block: '' },
    { key: 'prelight', suffix: 'P', block: 'pre' },
    { key: 'pickup', suffix: 'R', block: 'pick' },
  ];
  for (const day of (week.days || []) as AnyRecord[]) {
    for (const { key, suffix, block } of SOURCES) {
      for (const m of (day[key] as AnyRecord[]) || []) {
        const rawRole = String(m.role || '').trim().toUpperCase();
        const sourceSuffix =
          m.source === 'pre' ? 'P' : m.source === 'pick' ? 'R' : suffix;
        const isRefuerzo = rawRole.startsWith('REF');
        const role = isRefuerzo
          ? stripRefuerzoSuffix(rawRole) || 'REF'
          : !rawRole
            ? ''
            : !sourceSuffix
              ? stripRoleSuffix(rawRole)
              : hasRoleGroupSuffix(rawRole)
                ? rawRole
                : `${stripRoleSuffix(rawRole)}${sourceSuffix}`;
        const name = String(m.name || '').trim() || `Persona_${role || 'UNKNOWN'}`;
        const persona: AnyRecord = {
          id: '',
          cargo: role,
          nombre: name,
          role,
          name,
          gender: (m as AnyRecord)?.gender,
          personId: (m as AnyRecord)?.personId,
          roleId: (m as AnyRecord)?.roleId,
          roleLabel: (m as AnyRecord)?.roleLabel,
          source: (m as AnyRecord)?.source,
          __block: block || undefined,
        };
        const id = personaKey(persona);
        if (!seen.has(id) && (role || name)) {
          seen.add(id);
          out.push({ ...persona, id });
        }
      }
    }
  }
  return out;
}

/**
 * Translate week label
 */
export function translateWeekLabel(label: string, t: (key: string, options?: any) => string): string {
  if (!label) return '';
  // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
  const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
  if (match) {
    const number = match[2];
    if (number.startsWith('-')) {
      return t('planning.weekFormatNegative', { number: number.substring(1) });
    } else {
      return t('planning.weekFormat', { number });
    }
  }
  // If it doesn't match the pattern, return as is (might be custom label)
  return label;
}

/**
 * Format date for title (DD/MM/YYYY)
 */
export function formatDateForTitle(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}
