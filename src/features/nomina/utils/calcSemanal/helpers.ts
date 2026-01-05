import { norm } from '@shared/utils/normalize';

/**
 * Generate storage key variants for robust data lookup
 */
export function storageKeyVariants(storageKey: string): string[] {
  const [rolePart, name = ''] = String(storageKey || '').split('__');
  const baseRole = String(rolePart || '').replace(/[PR]$/, '');
  const variants = new Set<string>();
  
  // Claves base
  variants.add(`${rolePart}__${name}`);
  variants.add(`${baseRole}__${name}`);
  variants.add(`${baseRole}P__${name}`);
  variants.add(`${baseRole}R__${name}`);
  
  // Claves específicas de Reportes (las que realmente se usan)
  variants.add(`${baseRole}.pre__${name}`);  // G.pre__nombre
  variants.add(`${baseRole}.pick__${name}`); // G.pick__nombre
  
  // Variantes históricas con guiones bajos
  variants.add(`${baseRole}_pre__${name}`);
  variants.add(`${baseRole}_pick__${name}`);
  
  // Variantes con el rol completo (ej: GP/GR) por si almacenamiento usó el rol extendido
  variants.add(`${rolePart}.pre__${name}`);
  variants.add(`${rolePart}.pick__${name}`);
  variants.add(`${rolePart}_pre__${name}`);
  variants.add(`${rolePart}_pick__${name}`);
  
  const result = Array.from(variants);
  // Debug temporal
  if (isDev()) {
    console.debug('[NOMINA.SKV]', storageKey, '=>', result.length, 'variants:', result);
  }
  return result;
}

/**
 * Get cell value candidates from data object, trying multiple storage keys and column names
 */
export function getCellValueCandidates(
  dataObj: any,
  storageKeys: string[],
  colNames: readonly string[],
  iso: string
) {
  if (isDev()) {
    console.debug('[NOMINA.GCVC]', 'Looking for', colNames, 'on', iso, 'in keys:', storageKeys);
  }
  
  // Priorizar claves específicas de GP/GR (.pre__, .pick__) sobre claves base
  const sortedKeys = [...storageKeys].sort((a, b) => {
    const aIsSpecific = a.includes('.pre__') || a.includes('.pick__');
    const bIsSpecific = b.includes('.pre__') || b.includes('.pick__');
    if (aIsSpecific && !bIsSpecific) return -1; // a primero
    if (!aIsSpecific && bIsSpecific) return 1;  // b primero
    return 0; // mismo orden
  });
  
  for (const sk of sortedKeys) {
    const cols = dataObj?.[sk];
    if (!cols) {
      if (isDev()) console.debug('[NOMINA.GCVC]', 'No data for key:', sk);
      continue;
    }
    if (isDev()) {
      console.debug('[NOMINA.GCVC]', 'Found data for key:', sk, 'columns:', Object.keys(cols));
    }
    // 1) Directo
    for (const cn of colNames) {
      const v = cols?.[cn]?.[iso];
      if (v != null && v !== '') {
        if (isDev()) console.debug('[NOMINA.GCVC]', 'Found direct match:', sk, cn, iso, '=', v);
        return v;
      }
    }
    // 2) Normalizado a lowercase sin tildes
    const toKey = new Map<string, string>();
    for (const k of Object.keys(cols)) {
      const low = norm(k);
      toKey.set(low, k);
    }
    for (const cn of colNames) {
      const low = norm(cn);
      const real = toKey.get(low);
      if (real) {
        const v = cols?.[real]?.[iso];
        if (v != null && v !== '') {
          if (isDev()) console.debug('[NOMINA.GCVC]', 'Found normalized match:', sk, real, iso, '=', v);
          return v;
        }
      }
    }
  }
  if (isDev()) console.debug('[NOMINA.GCVC]', 'No match found for', colNames, 'on', iso);
  return undefined;
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

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  try {
    if ((import.meta as any).env?.DEV) return true;
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      const q = String(window.location?.search || '');
      if (/debug=nomAgg/i.test(q)) return true;
      const ls = String(window.localStorage?.getItem('debug') || '');
      if (/nomAgg/i.test(ls)) return true;
    }
  } catch {}
  return false;
}

/**
 * Debug logging function
 */
export function dbgLog(...args: any[]) {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.debug('[NOMINA.AGG]', ...args);
  }
}

/**
 * Column name candidates for different concepts
 */
export const COL_CANDIDATES = {
  extras: ['Horas extra', 'Horas extras', 'HE'] as const,
  ta: ['Turn Around', 'TA'] as const,
  noct: ['Nocturnidad', 'Noct', 'Nocturnidades'] as const,
  dietas: ['Dietas', 'Dietas / Ticket', 'Ticket', 'Tickets'] as const,
  km: ['Kilometraje', 'KM', 'Km'] as const,
  transp: ['Transporte', 'Transportes'] as const,
  penalty: ['Penalty lunch', 'Penalty Lunch', 'Penalty', 'PL'] as const,
} as const;

/**
 * Role order for sorting
 */
export const ROLE_ORDER: Record<string, number> = { 
  // EQUIPO BASE
  G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6,
  // REFUERZOS
  REF: 7,
  // EQUIPO PRELIGHT
  GP: 8, BBP: 9, EP: 10, TMP: 11, FBP: 12, AUXP: 13, MP: 14,
  // EQUIPO RECOGIDA
  GR: 15, BBR: 16, ER: 17, TMR: 18, FBR: 19, AUXR: 20, MR: 21
};

