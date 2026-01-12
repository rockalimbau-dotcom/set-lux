export function parseNum(input: unknown): number {
  if (input == null || input === '') return 0;
  let s = String(input).trim();
  
  // Si tiene coma, asumir formato europeo (coma como decimal)
  // Si tiene punto y no tiene coma, asumir formato americano (punto como decimal)
  if (s.includes(',') && s.includes('.')) {
    // Formato mixto: eliminar puntos (separadores de miles) y convertir coma a punto
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // Solo coma: formato europeo, convertir a punto
    s = s.replace(',', '.');
  }
  // Si solo tiene punto, mantenerlo (formato americano)
  
  const n = Number(s);
  return isFinite(n) ? n : 0;
}

// Función para extraer el valor numérico de horas extra, manejando formato decimal con paréntesis
// Ejemplo: "0.58 (35')" -> 0.58, "1.5 (1h 30')" -> 1.5, "2" -> 2, "1,5" -> 1.5
export function parseHorasExtra(input: unknown): number {
  if (input == null || input === '') return 0;
  
  const str = String(input).trim();
  if (!str) return 0;
  
  // Si tiene formato "x.xx (xh x')" o "x.xx (x')", extraer el número decimal al inicio
  // También manejar formato con coma: "x,xx (xh x')"
  const match = str.match(/^([\d.,]+)/);
  if (match) {
    let numStr = match[1];
    // Convertir coma a punto si hay coma
    if (numStr.includes(',')) {
      numStr = numStr.replace(',', '.');
    }
    const num = parseFloat(numStr);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }
  
  // Si no tiene formato con paréntesis, usar parseNum normal (que maneja comas)
  return parseNum(input);
}

export function parseDietasValue(raw: unknown): { labels: string[]; ticket: number } {
  if (!raw) return { labels: [], ticket: 0 };

  let labels: string[] = [];
  let ticket = 0;

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
    
    // También buscar si el token completo es "Ticket" sin paréntesis ni precio
    if (t.toLowerCase() === 'ticket') {
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


