/** Parseo numérico compartido entre reportes (totales UI) y nómina (agregados). */

export function parseNum(input: unknown): number {
  if (input == null || input === '') return 0;
  let s = String(input).trim();

  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return isFinite(n) ? n : 0;
}

/**
 * Valor numérico de horas extra desde celda de reporte (ej. "0.58 (35')", "1,5 (1h 30')").
 * Debe coincidir con la agregación en nómina (`parseHorasExtra` exportado desde aquí).
 */
export function parseHorasExtra(input: unknown): number {
  if (input == null || input === '') return 0;

  const str = String(input).trim();
  if (!str) return 0;

  const match = str.match(/^([\d.,]+)/);
  if (match) {
    let numStr = match[1];
    if (numStr.includes(',') && numStr.includes('.')) {
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else if (numStr.includes(',')) {
      numStr = numStr.replace(',', '.');
    }
    const num = parseFloat(numStr);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }

  return parseNum(input);
}
