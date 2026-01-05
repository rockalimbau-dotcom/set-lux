import i18n from '../../../../i18n/config';
import { DayInfo } from './types';

/**
 * Pad number to 2 digits
 */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Parse YYYY-MM-DD string to Date
 */
export const parseYYYYMMDD = (s: string): Date => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Format date as DD/MM
 */
export const formatDDMM = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

/**
 * Escape HTML special characters
 */
export const esc = (s: any): string =>
  String(s ?? '').replace(
    /[&<>]/g,
    (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
  );

/**
 * Get day names array
 */
export const getDays = (): DayInfo[] => [
  { idx: 0, key: 'mon', name: i18n.t('reports.dayNames.monday') },
  { idx: 1, key: 'tue', name: i18n.t('reports.dayNames.tuesday') },
  { idx: 2, key: 'wed', name: i18n.t('reports.dayNames.wednesday') },
  { idx: 3, key: 'thu', name: i18n.t('reports.dayNames.thursday') },
  { idx: 4, key: 'fri', name: i18n.t('reports.dayNames.friday') },
  { idx: 5, key: 'sat', name: i18n.t('reports.dayNames.saturday') },
  { idx: 6, key: 'sun', name: i18n.t('reports.dayNames.sunday') },
];

/**
 * Translate week label
 */
export const translateWeekLabel = (label: string): string => {
  if (!label) return '';
  // Match patterns like "Semana 1", "Semana -1", "Week 1", "Setmana 1", etc.
  const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
  if (match) {
    const number = match[2];
    if (number.startsWith('-')) {
      return i18n.t('planning.weekFormatNegative', { number: number.substring(1) });
    } else {
      return i18n.t('planning.weekFormat', { number });
    }
  }
  // If it doesn't match the pattern, return as is (might be custom label)
  return label;
};

/**
 * Translate location value from planning
 */
export const translateLocationValue = (value: string): string => {
  if (!value) return '';
  const normalized = value.trim();
  // Translate common location values from planning
  if (normalized === 'Descanso' || normalized === 'DESCANSO' || normalized.toLowerCase() === 'descanso') {
    return i18n.t('planning.rest');
  }
  if (normalized === 'Fin' || normalized === 'FIN' || normalized.toLowerCase() === 'fin') {
    return i18n.t('planning.end');
  }
  return value;
};

/**
 * Get needs label for filename
 */
export const getNeedsLabel = (): string => {
  const currentLang = i18n?.language || 'es';
  let needsLabel = 'NecesidadesRodaje';
  if (i18n?.store?.data?.[currentLang]?.translation?.needs?.shootingNeeds) {
    const shootingNeeds = i18n.store.data[currentLang].translation.needs.shootingNeeds;
    needsLabel = shootingNeeds.replace(/\s+/g, '');
  } else {
    if (currentLang === 'en') needsLabel = 'ShootingNeeds';
    else if (currentLang === 'ca') needsLabel = 'NecessitatsRodatge';
  }
  return needsLabel;
};

/**
 * Get complete label for filename
 */
export const getCompleteLabel = (): string => {
  const currentLang = i18n?.language || 'es';
  if (currentLang === 'en') {
    return 'Complete';
  } else if (currentLang === 'ca') {
    return 'Complet';
  } else {
    return 'Completo'; // Spanish masculine
  }
};

