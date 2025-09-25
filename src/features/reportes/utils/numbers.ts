export function parseNum(input: any): number {
  if (input == null || input === '') return NaN;
  const s = String(input).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

export function parseHHMM(s: any): number | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = +m[1];
  const mm = +m[2];
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function diffMinutes(startHHMM: any, endHHMM: any): number | null {
  const s = parseHHMM(startHHMM);
  const e = parseHHMM(endHHMM);
  if (s == null || e == null) return null;
  return Math.max(0, e - s);
}

export function ceilHours(minutes: any): number {
  return Math.ceil((minutes || 0) / 60);
}
