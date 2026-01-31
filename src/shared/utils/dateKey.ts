export const mdKey = (m: number, d: number): string =>
  `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
