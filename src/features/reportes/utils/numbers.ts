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
  // Normalizar: detectar si el punto es decimal o separador de miles
  let normalized = s.trim();
  
  // Si tiene coma y punto, determinar cuál es el separador decimal
  if (normalized.includes(',') && normalized.includes('.')) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    // El que está más a la derecha es el separador decimal
    if (lastComma > lastDot) {
      // La coma es decimal, quitar puntos (separadores de miles)
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      // El punto es decimal, quitar comas (separadores de miles)
      normalized = normalized.replace(/,/g, '');
    }
  } else if (normalized.includes(',')) {
    // Solo tiene coma, puede ser decimal o separador de miles
    // Si hay más de 3 dígitos después de la coma, probablemente es separador de miles
    const parts = normalized.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Probablemente es decimal (ej: "1234,5" o "0,5")
      normalized = normalized.replace(',', '.');
    } else {
      // Probablemente es separador de miles (ej: "1,234")
      normalized = normalized.replace(/,/g, '');
    }
  } else if (normalized.includes('.')) {
    // Solo tiene punto, puede ser decimal o separador de miles
    // Si hay más de 3 dígitos después del punto, probablemente es separador de miles
    const parts = normalized.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Probablemente es decimal (ej: "1234.5" o "0.5"), no hacer nada
      // normalized ya está bien
    } else {
      // Probablemente es separador de miles (ej: "1.234"), quitar puntos
      normalized = normalized.replace(/\./g, '');
    }
  }
  
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
