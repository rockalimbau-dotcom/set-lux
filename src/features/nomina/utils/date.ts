export const pad2 = (n: number): string => String(n).padStart(2, '0');

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const parseYYYYMMDD = (s: string): Date => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

export const monthKeyFromISO = (iso: string): string => {
  const [y, m] = iso.split('-').map(Number);
  return `${y}-${pad2(m)}`;
};

// Import i18n for translations
import i18n from '@i18n';

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


