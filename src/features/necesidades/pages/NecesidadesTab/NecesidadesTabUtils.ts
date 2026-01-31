/**
 * Pad number to 2 digits
 */
const pad2 = (n: number): string => String(n).padStart(2, '0');

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
 * Format date to DD/MM
 */
export const formatDDMM = (date: Date): string => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

/**
 * Format date to DD/MM/YYYY
 */
export const formatDDMMYYYY = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

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

