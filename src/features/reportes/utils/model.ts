// Helpers de persona y modelo base para Reportes Semana
import { stripRoleSuffix, stripRefuerzoSuffix } from '@shared/constants/roles';

export const stripPR = (r: string): string => stripRoleSuffix(String(r || ''));

/**
 * Normalize a persona key by cleaning P/R suffixes from refuerzo roles
 * This ensures that "REFEP__name" and "REFE__name" are treated as the same key
 */
export function normalizePersonaKey(key: string): string {
  if (!key || typeof key !== 'string') return key;
  
  // Parse the key: can be "role__name", "role.pre__name", or "role.pick__name"
  let role = '';
  let name = '';
  let block = '';
  
  if (key.includes('.pre__')) {
    const [rolePart, ...nameParts] = key.split('.pre__');
    role = rolePart || '';
    name = nameParts.join('.pre__') || '';
    block = 'pre';
  } else if (key.includes('.pick__')) {
    const [rolePart, ...nameParts] = key.split('.pick__');
    role = rolePart || '';
    name = nameParts.join('.pick__') || '';
    block = 'pick';
  } else {
    const [rolePart, ...nameParts] = key.split('__');
    role = rolePart || '';
    name = nameParts.join('__') || '';
    block = 'base';
  }
  
  // For refuerzos, clean all P/R suffixes
  if (role.startsWith('REF')) {
    role = stripRefuerzoSuffix(role);
  }
  
  // Reconstruct the key
  if (block === 'pre') {
    return `${role}.pre__${name}`;
  } else if (block === 'pick') {
    return `${role}.pick__${name}`;
  } else {
    return `${role}__${name}`;
  }
}

export function personaRole(p: any): string {
  if (typeof p === 'string') return '';
  if (!p || typeof p !== 'object') return '';
  return p.role || p.cargo || '';
}

export function personaName(p: any): string {
  if (typeof p === 'string') return p;
  if (!p || typeof p !== 'object') return String(p ?? '');
  return p.name || p.nombre || p.label || '';
}

export function personaKey(p: any): string {
  const originalRole = personaRole(p) || '';
  const name = personaName(p) || '';
  
  // IMPORTANTE: Para refuerzos (REFG, REFE, REFBB, etc.), mantener código completo sin stripPR
  // Solo aplicar stripPR a roles normales (G, E, BB, etc.) para quitar sufijos P o R si existen
  const isRefuerzo = originalRole.startsWith('REF');
  let role: string;
  if (isRefuerzo) {
    // Para refuerzos, eliminar TODOS los sufijos P o R repetidamente (REFEP -> REFE, REFERP -> REFER -> REFE)
    role = stripRefuerzoSuffix(originalRole);
  } else {
    role = stripPR(originalRole);
  }
  
  // Si no hay rol ni nombre, generar una clave única para evitar claves vacías
  if (!role && !name) {
    return `UNKNOWN__${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Si no hay rol pero sí nombre, usar "UNKNOWN" como rol
  if (!role && name) {
    return `UNKNOWN__${name}`;
  }
  
  // Si no hay nombre pero sí rol, usar "UNKNOWN" como nombre
  if (role && !name) {
    return `${role}__UNKNOWN`;
  }
  
  // IMPORTANTE: Para refuerzos, mantener código completo (REFE, REFG, etc.) en la clave
  if (isRefuerzo) {
    const block = (p && (p.__block || p.block)) || '';
    if (block === 'pre') return `${role}.pre__${name}`; // REFE.pre__name, REFG.pre__name, etc.
    if (block === 'pick') return `${role}.pick__${name}`; // REFE.pick__name, REFG.pick__name, etc.
    return `${role}__${name}`; // REFE__name, REFG__name, etc.
  }
  
  // Roles no-REF: usar bloque explícito si viene marcado; si no, clave base sin PR
  const block = (p && (p.__block || p.block)) || '';
  if (block === 'pre') return `${role}.pre__${name}`;
  if (block === 'pick') return `${role}.pick__${name}`;
  return `${role}__${name}`;
}

export function seedWeekData(personas: any[] = [], semana: string[] = []): {
  [personaKey: string]: {
    [concepto: string]: {
      [fecha: string]: string;
    };
  };
} {
  const CONCEPTS = [
    'Dietas',
    'Transporte',
    'Kilometraje',
    'Nocturnidad',
    'Horas extra',
    'Turn Around',
    'Penalty lunch',
  ];
  const base: {
    [personaKey: string]: {
      [concepto: string]: {
        [fecha: string]: string;
      };
    };
  } = {};
  for (const p of personas) {
    const key = personaKey(p);
    base[key] = {};
    for (const c of CONCEPTS) {
      base[key][c] = {};
      for (const f of semana) base[key][c][f] = '';
    }
  }
  return base;
}
