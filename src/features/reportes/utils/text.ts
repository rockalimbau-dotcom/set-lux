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
  if (n === 'ticket' || n === 'bitllet') return 'Ticket';
  if (n === 'otros' || n === 'other' || n === 'others' || n === 'altres') return 'Otros';

  return cleaned;
}

const TICKET_WITH_AMOUNT = /^(?:ticket|bitllet)\(([-+]?\d+(?:[.,]\d+)?)\)$/i;
const OTHER_WITH_AMOUNT = /^(?:otros|other|others|altres)\(([-+]?\d+(?:[.,]\d+)?)\)$/i;
const TICKET_PLAIN = /^(?:ticket|bitllet)$/i;
const OTHER_PLAIN = /^(?:otros|other|others|altres)$/i;

function parseAmount(raw: string): number {
  return Number(String(raw).replace(',', '.'));
}

export function parseDietas(val: any): { items: Set<string>; ticket: number | null; other: number | null } {
  const out = { items: new Set<string>(), ticket: null as number | null, other: null as number | null };
  if (!val) return out;
  const parts = String(val)
    .split('+')
    .map(s => s.trim())
    .filter(Boolean);
  for (const p of parts) {
    const ticketMatch = p.match(TICKET_WITH_AMOUNT);
    if (ticketMatch) {
      out.items.add('Ticket');
      out.ticket = parseAmount(ticketMatch[1]);
      continue;
    }
    const otherMatch = p.match(OTHER_WITH_AMOUNT);
    if (otherMatch) {
      out.items.add('Otros');
      out.other = parseAmount(otherMatch[1]);
      continue;
    }
    if (TICKET_PLAIN.test(p)) {
      out.items.add('Ticket');
      continue;
    }
    if (OTHER_PLAIN.test(p)) {
      out.items.add('Otros');
      continue;
    }
    out.items.add(normalizeDietaItem(p));
  }
  return out;
}

export type ParsedDietas = ReturnType<typeof parseDietas>;

/** Texto de dietas para exportación HTML/PDF (ticket y otros incluidos, sin duplicar). */
export function formatParsedDietasForExport(
  parsed: ParsedDietas,
  translateItem: (item: string) => string = item => item
): string {
  const parts: string[] = [];
  for (const it of parsed.items) {
    if (it === 'Ticket' || it === 'Otros') continue;
    parts.push(translateItem(it));
  }
  if (parsed.items.has('Ticket')) {
    const label = translateItem('Ticket');
    parts.push(parsed.ticket != null ? `${label}(${parsed.ticket})` : label);
  }
  if (parsed.items.has('Otros')) {
    const label = translateItem('Otros');
    parts.push(parsed.other != null ? `${label}(${parsed.other})` : label);
  }
  return parts.join(' + ');
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
