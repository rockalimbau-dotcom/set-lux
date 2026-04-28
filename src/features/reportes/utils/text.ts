// Normalización y helpers de dietas
import { norm } from '@shared/utils/normalize';

// Re-exportar norm para mantener compatibilidad con imports existentes
export { norm };

function normalizeDietaItem(item: string): string {
  const cleaned = String(item || '').trim();
  const n = norm(cleaned);
  if (!n) return cleaned;

  if (n === 'comida' || n === 'dinar' || n === 'lunch') return 'Comida';
  if (n === 'cena' || n === 'sopar' || n === 'dinner') return 'Cena';
  if (n === 'desayuno' || n === 'esmorzar' || n === 'breakfast') return 'Desayuno';
  if (
    n === 'dieta sin pernoctar' ||
    n === 'dieta sense pernoctar' ||
    n === 'diet without overnight'
  ) return 'Dieta sin pernoctar';
  if (
    n === 'dieta con pernocta' ||
    n === 'dieta amb pernocta' ||
    n === 'dieta completa + desayuno' ||
    n === 'full diet + breakfast'
  ) return 'Dieta con pernocta';
  if (
    n === 'gastos de bolsillo' ||
    n === 'despeses de butxaca' ||
    n === 'pocket expenses'
  ) return 'Gastos de bolsillo';

  return cleaned;
}

export function parseDietas(val: any): { items: Set<string>; ticket: number | null; other: number | null } {
  const out = { items: new Set<string>(), ticket: null as number | null, other: null as number | null };
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
      continue;
    }
    const o = p.match(/^Otros\(([-+]?\d+(?:[\.,]\d+)?)\)$/i);
    if (o) {
      out.items.add('Otros');
      out.other = Number(String(o[1]).replace(',', '.'));
    } else {
      out.items.add(normalizeDietaItem(p));
    }
  }
  return out;
}

export function formatDietas(itemsSet: Set<string>, ticket: number | null, other: number | null): string {
  const items = Array.from(itemsSet || []);
  const out: string[] = [];
  for (const it of items) {
    if (it === 'Ticket') {
      out.push(
        ticket != null && ticket !== '' ? `Ticket(${ticket})` : 'Ticket'
      );
    } else if (it === 'Otros') {
      out.push(
        other != null && other !== '' ? `Otros(${other})` : 'Otros'
      );
    } else {
      out.push(it);
    }
  }
  return out.join(' + ');
}
