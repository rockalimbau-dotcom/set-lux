import { stripPR, buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from '../plan';
import { storageKeyVariants } from './helpers';

/**
 * Create storage key for a role and name
 */
export function storageKeyFor(roleCode: string, name: string, refuerzoSet: Set<string>): string {
  const base = stripPR(roleCode || '');
  const keyNoPR = `${base}__${name || ''}`;
  if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`;
  const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
  const roleForKey = suffix ? `${base}${suffix}` : base;
  return `${roleForKey}__${name || ''}`;
}

/**
 * Get visible role for a role code and name
 */
export function visibleRoleFor(roleCode: string, name: string, refuerzoSet: Set<string>, source?: string): string {
  // Si el rol empieza con "REF" (REFG, REFBB, etc.), preservar el código completo
  if (roleCode && roleCode.startsWith('REF') && roleCode.length > 3) {
    return roleCode; // Devolver REFG, REFBB, REFE, etc. en lugar de solo 'REF'
  }
  const base = stripPR(roleCode || '');
  const keyNoPR = `${base}__${name || ''}`;
  if (refuerzoSet.has(keyNoPR)) return 'REF';
  if (source === 'base') return base;
  const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
  return suffix ? `${base}${suffix}` : base;
}

function detectBlock(roleCode: string, source?: string): 'base' | 'pre' | 'pick' {
  if (source === 'pre') return 'pre';
  if (source === 'pick') return 'pick';
  if (/P$/i.test(roleCode || '')) return 'pre';
  if (/R$/i.test(roleCode || '')) return 'pick';
  return 'base';
}

function buildRowKey(roleVisible: string, name: string, block: 'base' | 'pre' | 'pick'): string {
  if (block === 'pre') return `${roleVisible}.pre__${name || ''}`;
  if (block === 'pick') return `${roleVisible}.pick__${name || ''}`;
  return `${roleVisible}__${name || ''}`;
}

/**
 * Build unique storage keys map for a week
 */
export function buildUniqueStorageKeys(
  week: any,
  refuerzoSet: Set<string>
) : Map<string, { roleVisible: string; name: string; gender?: 'male' | 'female' | 'neutral'; source?: string; rowKey: string; matchRole: string; displayBlock: 'base' | 'pre' | 'pick' }> {
  const rawPeople = weekAllPeopleActive(week);
  const uniqStorageKeys = new Map<string, { roleVisible: string; name: string; gender?: 'male' | 'female' | 'neutral'; source?: string; rowKey: string; matchRole: string; displayBlock: 'base' | 'pre' | 'pick' }>();

  for (const p of rawPeople) {
    const r = p.role || '';
    const n = p.name || '';
    const roleVisible = visibleRoleFor(r, n, refuerzoSet, (p as any)?.source);
    const gender = (p as any)?.gender;
    const source = (p as any)?.source;
    const displayBlock = detectBlock(r, source);
    const rowKey = buildRowKey(roleVisible, n, displayBlock);
    const matchRole =
      displayBlock === 'pre'
        ? `${stripPR(r)}P`
        : displayBlock === 'pick'
        ? `${stripPR(r)}R`
        : stripPR(r);
    // Verificar si es un refuerzo (REF o REFG, REFBB, etc.)
    const isRef = roleVisible === 'REF' || (roleVisible && roleVisible.startsWith('REF') && roleVisible.length > 3);
    if (isRef) {
      // Admitimos claves separadas por bloque en Reportes
      const keys = [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`];
      for (const sk of keys) {
        if (!uniqStorageKeys.has(sk)) {
          const refBlock = sk.includes('.pre__') ? 'pre' : sk.includes('.pick__') ? 'pick' : 'base';
          uniqStorageKeys.set(sk, {
            roleVisible,
            name: n,
            gender,
            source,
            rowKey: buildRowKey(roleVisible, n, refBlock),
            matchRole: r,
            displayBlock: refBlock,
          });
        }
      }
    } else {
      const storageKey = storageKeyFor(r, n, refuerzoSet);
      if (!uniqStorageKeys.has(storageKey)) {
        uniqStorageKeys.set(storageKey, { roleVisible, name: n, gender, source, rowKey, matchRole, displayBlock });
      }
    }
  }

  return uniqStorageKeys;
}

/**
 * Get keys to use for data lookup (handles REF special case)
 */
export function getKeysToUse(
  storageKey: string,
  roleVisible: string
): string[] {
  // Verificar si es un refuerzo (REF o REFG, REFBB, etc.)
  const isRef = roleVisible === 'REF' || (roleVisible && roleVisible.startsWith('REF') && roleVisible.length > 3);
  return isRef ? [storageKey] : storageKeyVariants(storageKey);
}
