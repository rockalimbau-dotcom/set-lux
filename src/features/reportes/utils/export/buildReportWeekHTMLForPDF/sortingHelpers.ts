import { rolePriorityForReports } from '../dataHelpers';
import { stripRoleSuffix, stripRefuerzoSuffix } from '@shared/constants/roles';

/**
 * Get block type from person key (base, pre, pick)
 */
function getBlockFromKey(key: string): 'base' | 'pre' | 'pick' {
  if (/\.pre__/.test(key) || /REF\.pre__/.test(key)) return 'pre';
  if (/\.pick__/.test(key) || /REF\.pick__/.test(key)) return 'pick';
  return 'base';
}

/**
 * Get base role (without P or R suffix)
 * IMPORTANTE: Los refuerzos (REFG, REFE, REFBB, etc.) NO tienen sufijos P o R, así que se mantienen tal cual
 */
function getBaseRole(role: string): string {
  const r = String(role).toUpperCase().trim();
  // Si es un refuerzo con código completo (REFG, REFE, etc.), mantenerlo tal cual
  if (r.startsWith('REF') && r.length > 3) return stripRefuerzoSuffix(r);
  if (r === 'REF') return 'REF';
  // Para roles normales, eliminar sufijos P o R
  if (r.startsWith('REF')) return stripRefuerzoSuffix(r);
  return stripRoleSuffix(r);
}

/**
 * Get base role priority
 */
function getBaseRolePriority(role: string): number {
  const baseRole = getBaseRole(role);
  return rolePriorityForReports(baseRole);
}

/**
 * Sort keys by role hierarchy within a block
 * IMPORTANTE: Mantener refuerzos juntos al final, ordenados por nombre
 */
function sortByRoleHierarchy(
  keys: string[],
  block: 'base' | 'pre' | 'pick'
): string[] {
  return keys.sort((a, b) => {
    // Parsear roles de las claves (pueden tener formato "role.pre__name" o "role__name")
    let roleA = '';
    let roleB = '';
    
    if (a.includes('.pre__')) {
      roleA = a.split('.pre__')[0];
    } else if (a.includes('.pick__')) {
      roleA = a.split('.pick__')[0];
    } else {
      roleA = a.split('__')[0];
    }
    
    if (b.includes('.pre__')) {
      roleB = b.split('.pre__')[0];
    } else if (b.includes('.pick__')) {
      roleB = b.split('.pick__')[0];
    } else {
      roleB = b.split('__')[0];
    }

    // Detectar si son refuerzos
    const isRefA = roleA === 'REF' || (roleA.startsWith('REF') && roleA.length > 3);
    const isRefB = roleB === 'REF' || (roleB.startsWith('REF') && roleB.length > 3);

    // REF siempre al final dentro de su bloque
    if (isRefA && !isRefB) return 1;
    if (!isRefA && isRefB) return -1;

    // Si ambos son REF, ordenar por nombre
    if (isRefA && isRefB) {
      let nameA = '';
      let nameB = '';
      
      if (a.includes('.pre__')) {
        nameA = a.split('.pre__')[1] || '';
      } else if (a.includes('.pick__')) {
        nameA = a.split('.pick__')[1] || '';
      } else {
        nameA = a.split('__').slice(1).join('__') || '';
      }
      
      if (b.includes('.pre__')) {
        nameB = b.split('.pre__')[1] || '';
      } else if (b.includes('.pick__')) {
        nameB = b.split('.pick__')[1] || '';
      } else {
        nameB = b.split('__').slice(1).join('__') || '';
      }
      
      return nameA.localeCompare(nameB);
    }

    // Ambos no son REF: ordenar por jerarquía de rol base
    const priorityA = getBaseRolePriority(roleA);
    const priorityB = getBaseRolePriority(roleB);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Si misma prioridad, ordenar por nombre
    let nameA = '';
    let nameB = '';
    
    if (a.includes('.pre__')) {
      nameA = a.split('.pre__')[1] || '';
    } else if (a.includes('.pick__')) {
      nameA = a.split('.pick__')[1] || '';
    } else {
      nameA = a.split('__').slice(1).join('__') || '';
    }
    
    if (b.includes('.pre__')) {
      nameB = b.split('.pre__')[1] || '';
    } else if (b.includes('.pick__')) {
      nameB = b.split('.pick__')[1] || '';
    } else {
      nameB = b.split('__').slice(1).join('__') || '';
    }
    
    return nameA.localeCompare(nameB);
  });
}

/**
 * Group and sort persons by block
 * IMPORTANTE: Para paginación, mantener el orden natural dentro de cada bloque
 * sin separar refuerzos, para que los bloques se paginen completos
 */
export function groupAndSortPersonsByBlock(data: any, preserveOrder: boolean = false): {
  personsByBlock: { base: string[]; pre: string[]; pick: string[] };
  finalPersonKeys: string[];
} {
  const personsByBlock = {
    base: [] as string[],
    pre: [] as string[],
    pick: [] as string[],
  };

  // IMPORTANTE: Mantener el orden de inserción de las claves para preservar el orden original
  // Esto es crítico para que los refuerzos no se separen
  const keysInOrder = Object.keys(data || {});
  
  keysInOrder.forEach(key => {
    const block = getBlockFromKey(key);
    personsByBlock[block].push(key);
  });

  // Si preserveOrder es true, mantener el orden original pero ordenar por jerarquía
  // Esto es útil para paginación donde queremos mantener bloques completos pero con orden correcto
  if (preserveOrder) {
    // IMPORTANTE: Ordenar por jerarquía pero mantener refuerzos al final dentro de cada bloque
    // Esto asegura el orden correcto (G, BB, E, etc.) y evita que los refuerzos aparezcan primero
    personsByBlock.base = sortByRoleHierarchy(personsByBlock.base, 'base');
    personsByBlock.pre = sortByRoleHierarchy(personsByBlock.pre, 'pre');
    personsByBlock.pick = sortByRoleHierarchy(personsByBlock.pick, 'pick');
  } else {
    // Ordenar por jerarquía (comportamiento normal para visualización)
    personsByBlock.base = sortByRoleHierarchy(personsByBlock.base, 'base');
    personsByBlock.pre = sortByRoleHierarchy(personsByBlock.pre, 'pre');
    personsByBlock.pick = sortByRoleHierarchy(personsByBlock.pick, 'pick');
  }

  // Maintain order: base, pre, pick
  const finalPersonKeys = [
    ...personsByBlock.base,
    ...personsByBlock.pre,
    ...personsByBlock.pick,
  ];

  return { personsByBlock, finalPersonKeys };
}

