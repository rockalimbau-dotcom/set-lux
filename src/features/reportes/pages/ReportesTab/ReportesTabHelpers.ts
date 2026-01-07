import { parseYYYYMMDD, toYYYYMMDD, addDays } from '@shared/utils/date';
import { AnyRecord } from '@shared/types/common';

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
    { key: 'team', suffix: '' },
    { key: 'prelight', suffix: 'P' },
    { key: 'pickup', suffix: 'R' },
  ];
  for (const day of (week.days || []) as AnyRecord[]) {
    for (const { key, suffix } of SOURCES) {
      for (const m of (day[key] as AnyRecord[]) || []) {
        const baseRole = m.role || '';
        const role = baseRole ? `${baseRole}${suffix}` : '';
        // Generar nombre por defecto si no hay nombre
        const name = m.name || `Persona_${baseRole || 'UNKNOWN'}`;
        const id = `${role}__${name}`;
        if (!seen.has(id) && (role || name)) {
          seen.add(id);
          out.push({ id, cargo: role, nombre: name });
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

