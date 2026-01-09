import { RowIn } from '../MonthSectionTypes';

/**
 * Calculate total working days based on project mode
 */
export function calculateTotalWorkingDays(
  projectMode: 'semanal' | 'mensual' | 'diario',
  calculateWorkingDaysInMonthValue: number,
  workedDays: number,
  rodaje?: number,
  oficina?: number
): number {
  if (projectMode === 'mensual') {
    return calculateWorkingDaysInMonthValue;
  }
  if (projectMode === 'diario') {
    return (rodaje || 0) + (oficina || 0);
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

