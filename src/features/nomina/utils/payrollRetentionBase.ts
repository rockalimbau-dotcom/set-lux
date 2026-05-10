/**
 * Base sobre la que se aplican IRPF y Estado cuando las dietas pueden excluirse (desgravar).
 * Si `dietasExentasIRPF`, solo grava el bruto menos el total dietas (no menos que 0).
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
