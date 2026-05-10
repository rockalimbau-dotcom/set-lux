/**
 * Base solo para IRPF cuando las dietas son exentas (no forman parte de la base retributiva a efectos IRPF).
 * El campo «Estado» (cotización aprox.) usa el TOTAL BRUTO aparte — ver MonthSection.
 */
export function retentionBaseIrpfEstado(
  totalBruto: number,
  totalDietas: number,
  dietasExentasIRPF: boolean
): number {
  const bruto = Number(totalBruto) || 0;
  const dietas = Number(totalDietas) || 0;
  if (!dietasExentasIRPF || dietas <= 0) return bruto;
  return Math.max(0, bruto - dietas);
}

/** Base sobre la que aplica el % «Estado» (aprox. cotizaciones): siempre el bruto íntegro del mes en pantalla. */
export function baseEstadoPercentApplied(totalBruto: number): number {
  return Math.max(0, Number(totalBruto) || 0);
}

/**
 * Suma típica en recibo (trabajador): contingencias comunes + MEI + formación + desempleo
 * (p. ej. 4,70 + 0,15 + 0,10 + 1,60 = 6,55 % sobre la base de cotización de la SS).
 * En pantalla el % se aplica al TOTAL BRUTO de la fila, no a esa base legal → el € puede diferir.
 */
export const DEFAULT_ESTADO_SOCIAL_PERCENT = 6.55;
