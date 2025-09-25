// Normalización y helpers de dietas

export const norm = (s: any): string =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

export function parseDietas(val: any): { items: Set<string>; ticket: number | null } {
  const out = { items: new Set<string>(), ticket: null as number | null };
  if (!val) return out;
  const parts = String(val)
    .split('+')
    .map(s => s.trim())
    .filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^Ticket\(([-+]?\d+(?:[\.,]\d+)?)\)$/i);
    if (m) {
      out.items.add('Ticket');
      out.ticket = Number(String(m[1]).replace(',', '.'));
    } else {
      out.items.add(p);
    }
  }
  return out;
}

export function formatDietas(itemsSet: Set<string>, ticket: number | null): string {
  const items = Array.from(itemsSet || []);
  const out: string[] = [];
  for (const it of items) {
    if (it === 'Ticket') {
      out.push(
        ticket != null && ticket !== '' ? `Ticket(${ticket})` : 'Ticket'
      );
    } else {
      out.push(it);
    }
  }
  return out.join(' + ');
}
