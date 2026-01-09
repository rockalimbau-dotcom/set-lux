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
export function visibleRoleFor(roleCode: string, name: string, refuerzoSet: Set<string>): string {
  // Si el rol empieza con "REF" (REFG, REFBB, etc.), tratarlo como refuerzo
  if (roleCode && roleCode.startsWith('REF') && roleCode.length > 3) {
    return 'REF';
  }
  const base = stripPR(roleCode || '');
  const keyNoPR = `${base}__${name || ''}`;
  if (refuerzoSet.has(keyNoPR)) return 'REF';
  const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
  return suffix ? `${base}${suffix}` : base;
}

/**
 * Build unique storage keys map for a week
 */
export function buildUniqueStorageKeys(
  week: any,
  refuerzoSet: Set<string>
): Map<string, { roleVisible: string; name: string }> {
  const rawPeople = weekAllPeopleActive(week);
  const uniqStorageKeys = new Map<string, { roleVisible: string; name: string }>();

  for (const p of rawPeople) {
    const r = p.role || '';
    const n = p.name || '';
    const roleVisible = visibleRoleFor(r, n, refuerzoSet);
    if (roleVisible === 'REF') {
      // Admitimos claves separadas por bloque en Reportes
      const keys = [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`];
      for (const sk of keys) {
        if (!uniqStorageKeys.has(sk)) {
          uniqStorageKeys.set(sk, { roleVisible, name: n });
        }
      }
    } else {
      const storageKey = storageKeyFor(r, n, refuerzoSet);
      if (!uniqStorageKeys.has(storageKey)) {
        uniqStorageKeys.set(storageKey, { roleVisible, name: n });
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
  return roleVisible === 'REF' ? [storageKey] : storageKeyVariants(storageKey);
}

