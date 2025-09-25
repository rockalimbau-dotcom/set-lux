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

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function defaultWeek(): string[] {
  const start = mondayOf(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISO(d);
  });
}
