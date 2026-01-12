export function parseNum(input: any): number {
  if (input == null || input === '') return NaN;
  const s = String(input).trim();
  
  // Si contiene operadores matemáticos (+, -, *, /), evaluar la expresión
  if (/[+\-*/]/.test(s)) {
    try {
      // Normalizar: reemplazar comas por puntos para decimales
      // Si tiene comas, asumir formato europeo (puntos = miles, coma = decimal)
      let normalized = s;
      
      if (s.includes(',')) {
        // Si también tiene puntos, quitar los puntos (separadores de miles)
        if (s.includes('.')) {
          normalized = s.replace(/\./g, '').replace(',', '.');
        } else {
          // Solo coma, es decimal
          normalized = s.replace(',', '.');
        }
      }
      
      // Eliminar espacios
      const cleaned = normalized.replace(/\s/g, '');
      
      // Validar que solo contenga números, operadores básicos y paréntesis
      if (!/^[\d+\-*/().]+$/.test(cleaned)) {
        // Si contiene caracteres no permitidos, intentar parsear como número simple
        return parseNumSimple(s);
      }
      
      // Evaluar la expresión de forma segura usando Function constructor
      // Esto solo permite expresiones matemáticas básicas, sin acceso a funciones globales
      const result = Function(`"use strict"; return (${cleaned})`)();
      return isFinite(result) ? result : NaN;
    } catch (e) {
      // Si falla la evaluación, intentar parsear como número simple
      return parseNumSimple(s);
    }
  }
  
  // Si no es una expresión, parsear como número simple
  return parseNumSimple(s);
}

/**
 * Parsea un número simple (sin expresiones)
 */
function parseNumSimple(s: string): number {
  // Normalizar: quitar puntos de miles y convertir coma a punto decimal
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
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
