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
