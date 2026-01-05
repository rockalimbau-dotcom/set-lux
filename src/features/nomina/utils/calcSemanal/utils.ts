import { parseYYYYMMDD } from '@shared/utils/date';
import { loadCondModel } from '../cond';

/**
 * Get condition parameters for a project
 */
export function getCondParams(project: any) {
  const m = loadCondModel(project);
  return m?.params || {};
}

/**
 * Get overtime window for a payroll month
 */
export function getOvertimeWindowForPayrollMonth(monthKey: string, params: any) {
  const [Y, M] = monthKey.split('-').map(Number);
  const ini = parseInt(params?.heCierreIni, 10);
  const fin = parseInt(params?.heCierreFin, 10);
  if (
    !Number.isInteger(ini) ||
    !Number.isInteger(fin) ||
    ini < 1 ||
    ini > 31 ||
    fin < 1 ||
    fin > 31
  )
    return null;
  const start = new Date(Y, M - 1 - 1, ini, 0, 0, 0, 0);
  const end = new Date(Y, M - 1, fin, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Check if an ISO date string is within a date range
 */
export function isoInRange(iso: string, start: Date, end: Date) {
  const d = parseYYYYMMDD(iso);
  return d >= start && d <= end;
}

