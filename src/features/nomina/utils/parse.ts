export function parseNum(input: unknown): number {
  if (input == null || input === '') return 0;
  const s = String(input).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

export function parseDietasValue(raw: unknown): { labels: string[]; ticket: number } {
  if (!raw) return { labels: [], ticket: 0 };

  let labels: string[] = [];
  let ticket = 0;

  const addToken = (s: unknown) => {
    const t = String(s).trim();
    if (!t) return;

    const m = t.match(/ticket\s*[\(:]?\s*([\d.,]+)/i);
    if (m) {
      ticket += parseNum(m[1]);
      labels.push('Ticket');
      return;
    }
    labels.push(t);
  };

  try {
    if (/^\s*\[/.test(String(raw))) {
      const arr = JSON.parse(String(raw));
      if (Array.isArray(arr)) arr.forEach(addToken);
    } else {
      String(raw)
        .split('+')
        .map(x => x.trim())
        .filter(Boolean)
        .forEach(addToken);
    }
  } catch {
    String(raw)
      .split('+')
      .map(x => x.trim())
      .filter(Boolean)
      .forEach(addToken);
  }

  const normalize = (s: string): string => {
    const t = s.toLowerCase();
    if (t.startsWith('dieta completa')) return 'Dieta completa + desayuno';
    if (t.startsWith('dieta sin')) return 'Dieta sin pernoctar';
    if (t === 'gastos de bolsillo' || t.startsWith('gastos')) return 'Gastos de bolsillo';
    if (t === 'comida') return 'Comida';
    if (t === 'cena') return 'Cena';
    if (t.startsWith('ticket')) return 'Ticket';
    return s;
  };

  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const l of labels.map(normalize)) {
    const k = l.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(l);
    }
  }
  return { labels: uniq, ticket };
}


