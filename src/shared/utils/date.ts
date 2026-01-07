// Import i18n for translations (necesario para monthLabelEs)
import i18n from '../../i18n/config';

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const toYYYYMMDD = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseYYYYMMDD = (s: string | number): Date => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

export const formatDDMMYYYY = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

// Funciones adicionales de reportes
export function toDisplayDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  } catch {
    return iso;
  }
}

export function dayNameFromISO(iso: string, index: number, dayNames: string[]): string {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const js = dt.getDay();
    const map = [6, 0, 1, 2, 3, 4, 5];
    const idx = map[js] ?? index;
    return dayNames[idx] ?? dayNames[index] ?? '';
  } catch {
    return dayNames[index] ?? '';
  }
}

export function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function defaultWeek(dateOrISO?: string | Date): string[] {
  let baseDate: Date;
  if (dateOrISO === undefined) {
    baseDate = new Date();
  } else if (typeof dateOrISO === 'string') {
    try {
      const [y, m, d] = dateOrISO.split('-').map(Number);
      baseDate = new Date(y, (m || 1) - 1, d || 1);
      // Si la fecha es inválida, usar fecha actual
      if (isNaN(baseDate.getTime())) {
        baseDate = new Date();
      }
    } catch {
      baseDate = new Date();
    }
  } else {
    baseDate = dateOrISO;
  }
  const start = mondayOf(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toYYYYMMDD(d);
  });
}

// Funciones adicionales de nómina
export const monthKeyFromISO = (iso: string): string => {
  const [y, m] = iso.split('-').map(Number);
  return `${y}-${pad2(m)}`;
};

const getMonthName = (monthNumber: number): string => {
  const monthKeys = [
    'common.months.january',
    'common.months.february',
    'common.months.march',
    'common.months.april',
    'common.months.may',
    'common.months.june',
    'common.months.july',
    'common.months.august',
    'common.months.september',
    'common.months.october',
    'common.months.november',
    'common.months.december',
  ];
  const key = monthKeys[(monthNumber || 1) - 1];
  return key ? i18n.t(key) : '';
};

export const monthLabelEs = (monthKey: string, withYear = false): string => {
  const [y, m] = monthKey.split('-').map(Number);
  const name = getMonthName(m || 1);
  return withYear ? `${name} ${y}` : `${name}`;
};
