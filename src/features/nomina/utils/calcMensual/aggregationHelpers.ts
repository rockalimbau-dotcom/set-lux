import { stripPR, buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from '../plan';
import { stripRefuerzoSuffix } from '@shared/constants/roles';
import { storageKeyVariants } from './helpers';

/**
 * Create storage key for a role and name
 */
export function storageKeyFor(roleCode: string, name: string, refuerzoSet: Set<string>, roleId?: string): string {
  if (roleId) return `${roleId}__${name || ''}`;
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

function detectBlock(roleCode: string, source?: string, block?: string): 'base' | 'pre' | 'pick' | 'extra' {
  if (typeof block === 'string' && block.startsWith('extra:')) return 'extra';
  if (source === 'extra') return 'extra';
  if (source === 'pre') return 'pre';
  if (source === 'pick') return 'pick';
  if (/P$/i.test(roleCode || '')) return 'pre';
  if (/R$/i.test(roleCode || '')) return 'pick';
  return 'base';
}

function buildRowKey(
  roleVisible: string,
  name: string,
  block: 'base' | 'pre' | 'pick' | 'extra',
  roleId?: string
): string {
  const rowIdentity = String(roleId || roleVisible || '').trim();
  if (block === 'pre') return `${rowIdentity}.pre__${name || ''}`;
  if (block === 'pick') return `${rowIdentity}.pick__${name || ''}`;
  if (block === 'extra') return `${rowIdentity}.extra__${name || ''}`;
  return `${rowIdentity}__${name || ''}`;
}

function buildStorageKey(
  roleCode: string,
  name: string,
  refuerzoSet: Set<string>,
  block?: string,
  source?: string,
  roleId?: string
): string {
  if (roleId) {
    if (typeof block === 'string' && block.startsWith('extra:')) return `${roleId}.${block}__${name || ''}`;
    if (source === 'pre' || /P$/i.test(roleCode || '')) return `${roleId}.pre__${name || ''}`;
    if (source === 'pick' || /R$/i.test(roleCode || '')) return `${roleId}.pick__${name || ''}`;
    return `${roleId}__${name || ''}`;
  }
  if (typeof block === 'string' && block.startsWith('extra:')) {
    const normalizedRole =
      roleCode && roleCode.startsWith('REF') && roleCode.length > 3
        ? stripRefuerzoSuffix(roleCode || '')
        : stripPR(roleCode || '');
    return `${normalizedRole}.${block}__${name || ''}`;
  }
  return storageKeyFor(roleCode, name, refuerzoSet);
}

/**
 * Build unique storage keys map for a week
 */
export function buildUniqueStorageKeys(
  week: any,
  refuerzoSet: Set<string>
) : Map<string, { roleVisible: string; name: string; gender?: 'male' | 'female' | 'neutral'; source?: string; rowKey: string; matchRole: string; displayBlock: 'base' | 'pre' | 'pick' | 'extra'; roleId?: string; roleLabel?: string }> {
  const rawPeople = weekAllPeopleActive(week);
  const uniqStorageKeys = new Map<string, { roleVisible: string; name: string; personId?: string; gender?: 'male' | 'female' | 'neutral'; source?: string; rowKey: string; matchRole: string; displayBlock: 'base' | 'pre' | 'pick' | 'extra'; roleId?: string; roleLabel?: string }>();

  for (const p of rawPeople) {
    const r = p.role || '';
    const n = p.name || '';
    const roleVisible = visibleRoleFor(r, n, refuerzoSet, (p as any)?.source);
    const personId = (p as any)?.personId;
    const gender = (p as any)?.gender;
    const source = (p as any)?.source;
    const roleId = (p as any)?.roleId;
    const roleLabel = (p as any)?.roleLabel;
    const block = (p as any)?.block;
    const displayBlock = detectBlock(r, source, block);
    const rowKey = buildRowKey(roleVisible, n, displayBlock, roleId);
    const matchRole =
      displayBlock === 'pre'
        ? `${stripPR(r)}P`
        : displayBlock === 'pick'
        ? `${stripPR(r)}R`
        : stripPR(r);
    // Verificar si es un refuerzo (REF o REFG, REFBB, etc.)
    const isRef = roleVisible === 'REF' || (roleVisible && roleVisible.startsWith('REF') && roleVisible.length > 3);
    if (isRef) {
      if (displayBlock === 'extra' && typeof block === 'string' && block.startsWith('extra:')) {
        const storageKey = buildStorageKey(r, n, refuerzoSet, block, source, roleId);
        if (!uniqStorageKeys.has(storageKey)) {
          uniqStorageKeys.set(storageKey, {
            roleVisible,
            name: n,
            personId,
            gender,
            source,
            rowKey,
            matchRole: r,
            displayBlock,
            roleId,
            roleLabel,
          });
        }
        continue;
      }
      // Admitimos claves separadas por bloque en Reportes
      const keys = [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`];
      for (const sk of keys) {
        if (!uniqStorageKeys.has(sk)) {
          const refBlock = sk.includes('.pre__') ? 'pre' : sk.includes('.pick__') ? 'pick' : 'base';
          uniqStorageKeys.set(sk, {
            roleVisible,
            name: n,
            personId,
            gender,
            source,
            rowKey: buildRowKey(roleVisible, n, refBlock, roleId),
            matchRole: r,
            displayBlock: refBlock,
            roleId,
            roleLabel,
          });
        }
      }
    } else {
      const storageKey = buildStorageKey(r, n, refuerzoSet, block, source, roleId);
      if (!uniqStorageKeys.has(storageKey)) {
        uniqStorageKeys.set(storageKey, { roleVisible, name: n, personId, gender, source, rowKey, matchRole, displayBlock, roleId, roleLabel });
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
  if (isRef) return [storageKey];

  // Mantener lookup estricto por bloque para evitar dobles conteos
  // cuando una misma persona existe en más de una fila/bloque.
  if (storageKey.includes('.pre__')) {
    return [storageKey, storageKey.replace('.pre__', '_pre__')];
  }
  if (storageKey.includes('.pick__')) {
    return [storageKey, storageKey.replace('.pick__', '_pick__')];
  }
  if (storageKey.includes('_pre__')) {
    return [storageKey, storageKey.replace('_pre__', '.pre__')];
  }
  if (storageKey.includes('_pick__')) {
    return [storageKey, storageKey.replace('_pick__', '.pick__')];
  }
  if (/\.extra(?::\d+)?__/.test(storageKey)) {
    return [storageKey];
  }

  // Para filas base, usar solo variantes base (sin pre/pick/extra)
  const [rolePart, name = ''] = String(storageKey || '').split('__');
  const baseRole = stripPR(rolePart || '');
  return Array.from(
    new Set([
      `${rolePart}__${name}`,
      `${baseRole}__${name}`,
    ])
  );
}
