/**
 * Normaliza un string eliminando diacríticos, convirtiendo a minúsculas y recortando espacios.
 * Útil para comparaciones de nombres y textos sin importar acentos o mayúsculas.
 * 
 * @param s - El string a normalizar (puede ser cualquier tipo, se convertirá a string)
 * @returns El string normalizado
 * 
 * @example
 * norm('José María') // 'jose maria'
 * norm('Ángel Niño') // 'angel nino'
 * norm('  HOLA  ') // 'hola'
 */
export const norm = (s: any): string =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

/**
 * Compara dos strings de forma normalizada (sin acentos, minúsculas, sin espacios extra).
 * 
 * @param a - Primer string a comparar
 * @param b - Segundo string a comparar
 * @returns true si los strings son iguales después de normalizar
 * 
 * @example
 * nameEq('José', 'jose') // true
 * nameEq('María', 'maria') // true
 * nameEq('Juan', 'Pedro') // false
 */
export const nameEq = (a: any, b: any): boolean => {
  return norm(a) === norm(b);
};

