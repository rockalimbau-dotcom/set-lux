import { RowIn } from '../MonthSectionTypes';

/**
 * Calculate total working days based on project mode
 * Para refuerzos en modo mensual, usar workedDays (días específicos) en lugar del rango del mes
 */
export function calculateTotalWorkingDays(
  projectMode: 'semanal' | 'mensual' | 'diario',
  calculateWorkingDaysInMonthValue: number,
  workedDays: number,
  rodaje?: number,
  oficina?: number,
  prelight?: number,
  recogida?: number,
  isRefuerzo?: boolean
): number {
  if (projectMode === 'mensual') {
    // Para refuerzos en mensual, usar solo los días específicos donde están marcados
    if (isRefuerzo) {
      return workedDays;
    }
    // Para roles base, usar el rango desde el primer día trabajado hasta el final del mes
    return calculateWorkingDaysInMonthValue;
  }
  if (projectMode === 'diario') {
    return (rodaje || 0) + (oficina || 0) + (prelight || 0) + (recogida || 0);
  }
  return workedDays;
}

/**
 * Determine role display based on worked days breakdown
 */
export function determineRoleDisplay(
  role: string,
  baseRoleCode: string,
  workedBase: number,
  workedPre: number,
  workedPick: number
): string {
  // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), devolver 'REF'
  if (role === 'REF' || (role && role.startsWith('REF') && role.length > 3)) {
    return 'REF';
  }
  if (workedPre > 0 && workedBase === 0 && workedPick === 0) {
    return `${baseRoleCode}P`;
  }
  if (workedPick > 0 && workedBase === 0 && workedPre === 0) {
    return `${baseRoleCode}R`;
  }
  return baseRoleCode;
}

