export { parseNum, parseHorasExtra } from '@shared/utils/numericParse';

export function parseDietasValue(raw: unknown): { labels: string[]; ticket: number; other: number } {
  if (!raw) return { labels: [], ticket: 0, other: 0 };

  let labels: string[] = [];
  let ticket = 0;
  let other = 0;

  const addToken = (s: unknown) => {
    const t = String(s).trim();
    if (!t) return;

    // Buscar formato Ticket(22.5) o Ticket(22,5) - formato guardado en reportes
    // También aceptar ticket: 22.5 o ticket 22.5 para compatibilidad
    const ticketMatch = t.match(/^Ticket\s*\(([-+]?\d+(?:[\.,]\d+)?)\)$/i) || 
                        t.match(/^Ticket\s*:\s*([-+]?\d+(?:[\.,]\d+)?)$/i) ||
                        t.match(/^Ticket\s+([-+]?\d+(?:[\.,]\d+)?)$/i);
    
    if (ticketMatch) {
      // Parsear el número correctamente (manejar punto y coma como decimal)
      const numStr = ticketMatch[1].replace(',', '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && isFinite(num)) {
        ticket += num;
      }
      labels.push('Ticket');
      return;
    }

    // Buscar formato Otros(22.5) o Otros(22,5)
    const otherMatch = t.match(/^Otros\s*\(([-+]?\d+(?:[\.,]\d+)?)\)$/i) ||
                       t.match(/^Otros\s*:\s*([-+]?\d+(?:[\.,]\d+)?)$/i) ||
                       t.match(/^Otros\s+([-+]?\d+(?:[\.,]\d+)?)$/i);

    if (otherMatch) {
      const numStr = otherMatch[1].replace(',', '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && isFinite(num)) {
        other += num;
      }
      labels.push('Otros');
      return;
    }
    
    // También buscar si el token completo es "Ticket" sin paréntesis ni precio
    if (t.toLowerCase() === 'ticket') {
      labels.push('Ticket');
      return;
    }

    // Token "Otros" sin precio
    if (t.toLowerCase() === 'otros') {
      labels.push('Otros');
      return;
    }
    
    labels.push(t);
  };

  try {
    if (/^\s*\[/.test(String(raw))) {
      const arr = JSON.parse(String(raw));
      if (Array.isArray(arr)) arr.forEach(addToken);
    } else {
      const parts = String(raw)
        .split('+')
        .map(x => x.trim())
        .filter(Boolean);
      
      parts.forEach(addToken);
    }
  } catch {
    const parts = String(raw)
      .split('+')
      .map(x => x.trim())
      .filter(Boolean);
    
    parts.forEach(addToken);
  }

  const normalize = (s: string): string => {
    const t = s.toLowerCase().trim();
    
    // Legacy / full diet (con desayuno incluido)
    // Nota: en el formato guardado suele venir como tokens separados por '+'
    // (ej: "dieta completa + desayuno" => "dieta completa" + "desayuno"),
    // así que normalizamos por token para que cuente como overnight.
    if (
      t.includes('dieta completa') ||
      t.includes('full diet + breakfast') ||
      t.includes('full diet')
    ) {
      return 'Dieta con pernocta';
    }

    // Normalizar dieta con pernocta (reconocer todas las traducciones)
    if (t.includes('dieta con pernocta') || 
        t.includes('dieta amb pernocta') ||
        t.includes('full diet') || 
        t.includes('diet with overnight')) {
      return 'Dieta con pernocta';
    }
    
    // Normalizar dieta sin pernoctar (reconocer todas las traducciones)
    if (t.startsWith('dieta sin') || 
        t.includes('diet without overnight') || 
        t.includes('dieta sense pernoctar') ||
        t === 'dieta sin pernoctar') {
      return 'Dieta sin pernoctar';
    }
    
    // Normalizar gastos de bolsillo (reconocer todas las traducciones)
    if (t === 'gastos de bolsillo' || 
        t.startsWith('gastos') || 
        t === 'pocket expenses' || 
        t === 'despeses de butxaca') {
      return 'Gastos de bolsillo';
    }
    
    // Normalizar Comida (reconocer todas las traducciones: lunch, dinar, comida)
    if (t === 'comida' || t === 'lunch' || t === 'dinar') {
      return 'Comida';
    }
    
    // Normalizar Cena (reconocer todas las traducciones: dinner, sopar, cena)
    if (t === 'cena' || t === 'dinner' || t === 'sopar') {
      return 'Cena';
    }
    
    // Normalizar Ticket (reconocer todas las traducciones: ticket, bitllet)
    if (t.startsWith('ticket') || t === 'bitllet') {
      return 'Ticket';
    }

    // Normalizar Otros (reconocer traducciones: otros, other, altres)
    if (t === 'otros' || t === 'other' || t === 'altres') {
      return 'Otros';
    }
    
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
  // Criterio: si hay "Dieta con pernocta" (overnight), no contarlas aparte como
  // Comida/Cena para evitar doble conteo cuando el valor guardado viene en un formato legado.
  const hasOvernight = uniq.some(l => String(l).trim().toLowerCase() === 'dieta con pernocta');
  const finalLabels = hasOvernight
    ? uniq.filter(l => {
        const low = String(l).trim().toLowerCase();
        return low !== 'comida' && low !== 'cena';
      })
    : uniq;

  return { labels: finalLabels, ticket, other };
}

