export interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

export const DAYS: readonly DayInfo[] = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
] as const;

export const mdKey = (m: number, d: number): string =>
  `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
