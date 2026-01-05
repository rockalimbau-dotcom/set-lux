import { rolePriorityForReports } from '../dataHelpers';

/**
 * Get block type from person key (base, pre, pick)
 */
export function getBlockFromKey(key: string): 'base' | 'pre' | 'pick' {
  if (/\.pre__/.test(key) || /REF\.pre__/.test(key)) return 'pre';
  if (/\.pick__/.test(key) || /REF\.pick__/.test(key)) return 'pick';
  return 'base';
}

/**
 * Get base role (without P or R suffix)
 */
export function getBaseRole(role: string): string {
  const r = String(role).toUpperCase().trim();
  if (r === 'REF') return 'REF';
  return r.replace(/[PR]$/, '');
}

/**
 * Get base role priority
 */
export function getBaseRolePriority(role: string): number {
  const baseRole = getBaseRole(role);
  return rolePriorityForReports(baseRole);
}

/**
 * Sort keys by role hierarchy within a block
 */
export function sortByRoleHierarchy(
  keys: string[],
  block: 'base' | 'pre' | 'pick'
): string[] {
  return keys.sort((a, b) => {
    const [roleA] = String(a).split('__');
    const [roleB] = String(b).split('__');

    // For pre and pick blocks, separate REF from the rest
    if (block === 'pre' || block === 'pick') {
      const isRefA = roleA === 'REF' || roleA.startsWith('REF');
      const isRefB = roleB === 'REF' || roleB.startsWith('REF');

      // REF always at the end within its block
      if (isRefA && !isRefB) return 1;
      if (!isRefA && isRefB) return -1;

      // If both are REF or both are not REF, sort by name
      if (isRefA && isRefB) {
        const [, ...namePartsA] = String(a).split('__');
        const [, ...namePartsB] = String(b).split('__');
        const nameA = namePartsA.join('__');
        const nameB = namePartsB.join('__');
        return nameA.localeCompare(nameB);
      }

      // Both are not REF: sort by base role hierarchy
      const priorityA = getBaseRolePriority(roleA);
      const priorityB = getBaseRolePriority(roleB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    } else {
      // For base block, use normal priority
      const priorityA = rolePriorityForReports(roleA);
      const priorityB = rolePriorityForReports(roleB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    }

    // If same priority, sort by name
    const [, ...namePartsA] = String(a).split('__');
    const [, ...namePartsB] = String(b).split('__');
    const nameA = namePartsA.join('__');
    const nameB = namePartsB.join('__');
    return nameA.localeCompare(nameB);
  });
}

/**
 * Group and sort persons by block
 */
export function groupAndSortPersonsByBlock(data: any): {
  personsByBlock: { base: string[]; pre: string[]; pick: string[] };
  finalPersonKeys: string[];
} {
  const personsByBlock = {
    base: [] as string[],
    pre: [] as string[],
    pick: [] as string[],
  };

  Object.keys(data || {}).forEach(key => {
    const block = getBlockFromKey(key);
    personsByBlock[block].push(key);
  });

  personsByBlock.base = sortByRoleHierarchy(personsByBlock.base, 'base');
  personsByBlock.pre = sortByRoleHierarchy(personsByBlock.pre, 'pre');
  personsByBlock.pick = sortByRoleHierarchy(personsByBlock.pick, 'pick');

  // Maintain order: base, pre, pick
  const finalPersonKeys = [
    ...personsByBlock.base,
    ...personsByBlock.pre,
    ...personsByBlock.pick,
  ];

  return { personsByBlock, finalPersonKeys };
}

