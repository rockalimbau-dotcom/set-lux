import { loadCondModel } from '../cond';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD } from '@shared/utils/date';
import { norm } from '@shared/utils/normalize';
import { parseNum } from '../parse';
import { stripPR } from '../plan';

/**
 * Get condition parameters for diario mode
 */
export function getCondParams(project: any) {
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'diario'
    }
  };
  
  const m = loadCondModel(projectWithMode);
  return m?.params || {};
}

/**
 * Get overtime window for payroll month
 */
export function getOvertimeWindowForPayrollMonth(project: any, monthKey: string) {
  const params = getCondParams(project);
  const windowDays = parseNum(params.overtimeWindowDays) || 0;
  if (windowDays <= 0) return null;

  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return { start, end, days: windowDays };
}

/**
 * Check if an ISO date string is within a date range
 */
export function isoInRange(iso: string, start: Date, end: Date) {
  const d = parseYYYYMMDD(iso);
  if (!d) return false;
  return d >= start && d <= end;
}

/**
 * Generate storage key variants for flexible lookup
 */
export function storageKeyVariants(baseKey: string): string[] {
  const variants = [baseKey];
  
  // Si es una clave con sufijo, agregar variantes sin sufijo
  if (/[PR]__/.test(baseKey)) {
    const withoutSuffix = baseKey.replace(/[PR]__/, '__');
    variants.push(withoutSuffix);
  }
  
  // Si es una clave sin sufijo, agregar variantes con sufijos
  if (/^[A-Z]+__/.test(baseKey)) {
    const [role, name] = baseKey.split('__');
    variants.push(`${role}P__${name}`, `${role}R__${name}`);
  }
  
  // Agregar variantes con puntos
  for (const variant of [...variants]) {
    if (variant.includes('__')) {
      const withDots = variant.replace(/^([A-Z]+)([PR]?)__/, '$1.$2__');
      variants.push(withDots);
    }
  }
  
  // Agregar variantes con guiones bajos
  for (const variant of [...variants]) {
    if (variant.includes('.')) {
      const withUnderscores = variant.replace(/\./, '_');
      variants.push(withUnderscores);
    }
  }
  
  return [...new Set(variants)]; // Eliminar duplicados
}

/**
 * Get cell value from data using multiple storage keys and column candidates
 */
export function getCellValueCandidates(
  data: any,
  storageKeys: string[],
  columnCandidates: readonly string[],
  iso: string
): string | undefined {
  // Priorizar claves específicas (que contienen .pre__ o .pick__) sobre genéricas
  const prioritizedKeys = [...storageKeys].sort((a, b) => {
    const aSpecific = a.includes('.pre__') || a.includes('.pick__');
    const bSpecific = b.includes('.pre__') || b.includes('.pick__');
    if (aSpecific && !bSpecific) return -1;
    if (!aSpecific && bSpecific) return 1;
    return 0;
  });

  for (const key of prioritizedKeys) {
    const personData = data[key];
    if (!personData) continue;

    // 1) Búsqueda directa
    for (const col of columnCandidates) {
      const colData = personData[col];
      if (colData && colData[iso] != null && colData[iso] !== '') {
        return String(colData[iso]);
      }
    }

    // 2) Búsqueda normalizada (case-insensitive, sin acentos) - COMO EN SEMANAL
    const toKey = new Map<string, string>();
    for (const k of Object.keys(personData)) {
      const low = norm(k);
      toKey.set(low, k);
    }
    for (const col of columnCandidates) {
      const low = norm(col);
      const real = toKey.get(low);
      if (real) {
        const colData = personData[real];
        if (colData && colData[iso] != null && colData[iso] !== '') {
          return String(colData[iso]);
        }
      }
    }
  }
  return undefined;
}

/**
 * Get storage key for a role and name, considering blocks
 */
export function storageKeyFor(roleCode: string, name: string, block?: string): string {
  const base = stripPR(roleCode || '');
  
  // En diario NO hay refuerzos, pero SÍ hay prelight y pickup
  if (block === 'pre') return `${base}.pre__${name || ''}`;
  if (block === 'pick') return `${base}.pick__${name || ''}`;
  
  // Usar la clave base sin sufijo P/R para coincidir con reportes
  return `${base}__${name || ''}`;
}

/**
 * Check if a value represents "yes"
 */
export function valIsYes(v: unknown): boolean {
  const s = String(v || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
  return s === 'SI' || s === 'YES' || s === 'TRUE' || s === '1';
}

