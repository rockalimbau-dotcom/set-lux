import { personaRole, personaName } from './model';
import { isMemberRefuerzo } from './plan';
import { norm } from './text';

// Jerarquía completa de roles para reportes (igual que en planificación)
const rolePriorityForReports = (role: string = ''): number => {
  const r = String(role).toUpperCase().trim();
  
  // EQUIPO BASE
  if (r === 'G') return 0;
  if (r === 'BB') return 1;
  if (r === 'E') return 2;
  if (r === 'TM') return 3;
  if (r === 'FB') return 4;
  if (r === 'AUX') return 5;
  if (r === 'M') return 6;
  if (r === 'RIG') return 7;
  
  // REFUERZOS
  if (r === 'REF' || (r.startsWith('REF') && r.length > 3)) return 8;
  
  // EQUIPO PRELIGHT
  if (r === 'GP') return 9;
  if (r === 'BBP') return 10;
  if (r === 'EP') return 11;
  if (r === 'TMP') return 12;
  if (r === 'FBP') return 13;
  if (r === 'AUXP') return 14;
  if (r === 'MP') return 15;
  if (r === 'RIGP') return 16;
  
  // EQUIPO RECOGIDA
  if (r === 'GR') return 17;
  if (r === 'BBR') return 18;
  if (r === 'ER') return 19;
  if (r === 'TMR') return 20;
  if (r === 'FBR') return 21;
  if (r === 'AUXR') return 22;
  if (r === 'MR') return 23;
  if (r === 'RIGR') return 24;
  
  // Roles desconocidos al final
  return 1000;
};

// Función de ordenamiento para reportes
const sortByRoleHierarchy = <T extends { role?: string }>(list: T[] = []): T[] =>
  list
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => {
      const pa = rolePriorityForReports(a.it?.role);
      const pb = rolePriorityForReports(b.it?.role);
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx; // Mantener orden original para roles iguales
    })
    .map(({ it }) => it);

interface WeekAndDay {
  day: any;
}

interface Persona {
  role?: string;
  name?: string;
  [key: string]: any;
}

interface PersonaWithBlock extends Persona {
  __block?: string;
}

interface CollectWeekTeamWithSuffixFunction {
  (listKey: string, suffix: string): Persona[];
}

export function collectWeekTeamWithSuffixFactory(
  findWeekAndDay: (iso: string) => WeekAndDay, 
  safeSemana: string[]
): CollectWeekTeamWithSuffixFunction {
  return function collectWeekTeamWithSuffix(listKey: string, suffix: string): Persona[] {
    const set = new Set<string>();
    const out: Persona[] = [];
    for (const iso of safeSemana) {
      const { day } = findWeekAndDay(iso);
      const lst = day?.[listKey] || [];
      for (const m of lst) {
        if (!m) continue;
        const isRef = isMemberRefuerzo(m);
        const sourceSuffix =
          m.source === 'base'
            ? ''
            : m.source === 'pre'
            ? 'P'
            : m.source === 'pick'
            ? 'R'
            : suffix;
        // IMPORTANTE: Los refuerzos (REFG, REFE, REFBB, etc.) NUNCA llevan sufijo P o R
        // Solo los roles normales (G, E, BB, etc.) llevan sufijo cuando están en prelight/pickup
        let role: string;
        if (isRef) {
          const originalRole = String(m.role || '').trim();
          // Si el rol empieza con REF, mantenerlo tal cual SIN añadir sufijo
          // Esto incluye: 'REF', 'REFE', 'REFG', 'REFBB', etc.
          if (originalRole.startsWith('REF')) {
            // Mantener código completo sin añadir sufijo (REFG se mantiene como REFG, no REFGP)
            // IMPORTANTE: Eliminar TODOS los sufijos P o R repetidamente (REFEP -> REFE, REFERP -> REFER -> REFE)
            let cleanRole = originalRole;
            while (cleanRole.length > 3 && (cleanRole.endsWith('P') || cleanRole.endsWith('R'))) {
              cleanRole = cleanRole.replace(/[PR]$/, '');
            }
            role = cleanRole;
            // Si después de eliminar sufijos queda vacío o no empieza con REF, usar 'REF' genérico
            if (!role || !role.startsWith('REF')) {
              role = 'REF';
            }
          } else {
            // Si no empieza con REF pero isMemberRefuerzo lo detectó, usar 'REF' genérico
            role = 'REF';
          }
        } else {
          // Roles normales: añadir sufijo solo si el source lo indica
          const baseRole = String(m.role || '');
          if (!sourceSuffix) {
            role = baseRole.replace(/[PR]$/, '');
          } else {
            role = baseRole.endsWith(sourceSuffix) ? baseRole : `${baseRole}${sourceSuffix}`;
          }
        }
        const name = m.name || '';
        const key = `${role}__${name}`;
        if (!set.has(key)) {
          set.add(key);
          out.push({ role, name, gender: (m as any)?.gender, source: (m as any)?.source });
        }
      }
    }
    return out;
  };
}

export function buildSafePersonas(
  providedPersonas: Persona[],
  weekPrelightActive: boolean,
  prelightPeople: Persona[],
  weekPickupActive: boolean,
  pickupPeople: Persona[]
): Persona[] {
  const base = Array.isArray(providedPersonas) ? [...providedPersonas] : [];
  const seen = new Set<string>();
  const keyOf = (p: Persona) => {
    const r = String(personaRole(p) || '');
    const n = String(personaName(p) || '');
    const blk = (p as any)?.__block || '';
    return `${r}__${n}__${blk}`;
  };
  for (const p of base) seen.add(keyOf(p));

  const add = (arr: Persona[], block?: 'pre' | 'pick') => {
    for (const m of arr || []) {
      const isRef = String(m.role || '') === 'REF' || /^REF/.test(String(m.role || '')) || isMemberRefuerzo(m as any);
      let role: string;
      
      if (isRef) {
        // IMPORTANTE: Los refuerzos NUNCA deben tener sufijos P o R
        // Eliminar TODOS los sufijos P o R repetidamente (REFEP -> REFE, REFERP -> REFER -> REFE)
        let cleanRole = String(m.role || '').trim();
        while (cleanRole.length > 3 && (cleanRole.endsWith('P') || cleanRole.endsWith('R'))) {
          cleanRole = cleanRole.replace(/[PR]$/, '');
        }
        if (cleanRole === 'REF' || !cleanRole.startsWith('REF')) {
          role = 'REF';
        } else {
          role = cleanRole; // REFE, REFG, etc.
        }
      } else {
        role = m.role || '';
      }
      
      const item: Persona = { role, name: m.name || '', gender: (m as any)?.gender, __block: block };
      const k = keyOf(item as any);
      if (!seen.has(k)) {
        seen.add(k);
        base.push(item);
      }
    }
  };

  // Añadir personas detectadas en prelight/pickup, marcando REF con __block
  if (weekPrelightActive) add(prelightPeople, 'pre');
  if (weekPickupActive) add(pickupPeople, 'pick');

  // IMPORTANTE: NO normalizar roles REF a 'REF' genérico - mantener códigos completos (REFG, REFBB, etc.)
  // Solo normalizar si es exactamente 'REF' sin código base
  // Los roles con códigos completos (REFG, REFGP, REFGR, etc.) se mantienen tal cual

  // Eliminar entradas base duplicadas cuando existe una entrada de bloque (pre/pick) para la misma persona/rol
  const hasBlock = new Set<string>();
  for (const p of base) {
    const blk = (p as any)?.__block;
    if (blk === 'pre' || blk === 'pick') {
      hasBlock.add(`${String(personaRole(p) || '')}__${String(personaName(p) || '')}`);
    }
  }
  const filtered = base.filter(p => {
    const blk = (p as any)?.__block;
    const tag = `${String(personaRole(p) || '')}__${String(personaName(p) || '')}`;
    // Para roles normales, si existe una fila de bloque, ocultamos la fila base duplicada.
    // Para REF, mantenemos la fila base aunque existan filas de bloque (pre/pick).
    if (!blk && hasBlock.has(tag) && String(personaRole(p) || '') !== 'REF') return false;
    return true;
  });
  return filtered;
}

export function buildPeopleBase(
  basePeople: Persona[], 
  refNamesBase: Set<string>
): Persona[] {
  // Misma lógica que buildPeoplePre y buildPeoplePick
  const normals: Persona[] = [];
  const refs: Persona[] = [];
  const seen = new Set<string>();
  // Track nombres de refuerzos que ya están en basePeople (normalizados para comparación)
  const namesInBasePeople = new Set<string>();
  const refRolesInBasePeople = new Map<string, string>(); // Map nombre -> rol para refuerzos
  // También trackear todos los nombres procesados (no solo refuerzos) para evitar duplicados
  const allNamesInBasePeople = new Set<string>();
  
  // Procesar todos los miembros, agrupando refuerzos por nombre normalizado
  // para eliminar duplicados y preferir códigos completos sobre REF genérico
  const refsMap = new Map<string, { role: string; name: string; gender?: 'male' | 'female' | 'neutral' }>(); // nombre normalizado -> { role, name }
  
  for (const m of basePeople) {
    const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF'));
    let finalRole: string;
    
    if (isRefRole) {
      // Refuerzos: eliminar CUALQUIER sufijo P o R (incluso si está en medio como REFEP -> REFE)
      // IMPORTANTE: Los refuerzos pueden venir como "REFEP" o "REFER" si están en prelight/pickup
      // pero en base deben ser "REFE", "REFG", etc. sin sufijos
      let cleanRole = String(m.role || '').trim();
      // Eliminar TODOS los sufijos P o R al final, repetidamente hasta que no quede ninguno
      // Esto maneja casos como REFEP -> REFE, REFERP -> REFER -> REFE, etc.
      while (cleanRole.length > 3 && (cleanRole.endsWith('P') || cleanRole.endsWith('R'))) {
        cleanRole = cleanRole.replace(/[PR]$/, '');
      }
      
      if (cleanRole === 'REF' || !cleanRole.startsWith('REF')) {
        finalRole = 'REF';
      } else {
        finalRole = cleanRole; // REFE, REFG, REFBB, etc.
      }
      
      // Agrupar refuerzos por nombre normalizado para eliminar duplicados
      if (m.name) {
        const normalizedName = norm(m.name);
        const existing = refsMap.get(normalizedName);
        if (!existing) {
          // Primera vez que vemos este refuerzo
          refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
        } else if (finalRole !== 'REF' && existing.role === 'REF') {
          // Reemplazar REF genérico con código completo
          refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
        } else if (finalRole === 'REF' && existing.role !== 'REF') {
          // Ya hay código completo, mantener ese y saltar este genérico
          continue;
        } else if (finalRole === existing.role) {
          // Mismo rol, ya está procesado, saltar
          continue;
        }
      } else {
        // Sin nombre, saltar
        continue;
      }
    } else {
      // Roles normales: filtrar los que tienen sufijos P o R (solo base)
      finalRole = m.role || '';
      if (!/[PR]$/.test(finalRole)) {
        const key = `${finalRole}__${m.name || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          normals.push({ role: finalRole, name: m.name || '', gender: (m as any)?.gender });
          if (m.name) {
            allNamesInBasePeople.add(norm(m.name));
          }
        }
      }
    }
  }
  
  // Añadir refuerzos procesados (sin duplicados)
  // IMPORTANTE: Solo añadir un refuerzo por nombre normalizado
  const addedRefs = new Set<string>(); // Para trackear nombres normalizados ya añadidos
  for (const { role, name, gender } of refsMap.values()) {
    const normalizedName = norm(name);
    // Verificar que no hayamos añadido ya un refuerzo para este nombre
    if (!addedRefs.has(normalizedName)) {
      const key = `${role}__${name}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ role, name, gender });
        allNamesInBasePeople.add(normalizedName);
        namesInBasePeople.add(normalizedName);
        refRolesInBasePeople.set(normalizedName, role);
        addedRefs.add(normalizedName);
      }
    }
  }
  
  // IMPORTANTE: Solo añadir refuerzos de refNamesBase si NO están ya en basePeople
  // Esto evita duplicados: si ya tenemos REFE de basePeople, no añadir REF de refNamesBase
  // Si refNamesBase está vacío (ya fue filtrado), no hacer nada
  if (refNamesBase.size > 0) {
    for (const n of Array.from(refNamesBase)) {
      const normalizedName = norm(n);
      // Verificar si este nombre ya está en basePeople (con cualquier rol, no solo refuerzos)
      // Si ya está, NO añadir el REF genérico
      const nameAlreadyExists = allNamesInBasePeople.has(normalizedName);
      
      // También verificar si ya existe un refuerzo con código completo para este nombre
      const existingRefRole = refRolesInBasePeople.get(normalizedName);
      
      // Solo añadir REF genérico si:
      // 1. El nombre NO está en basePeople
      // 2. Y no hay un refuerzo con código completo para este nombre
      if (!nameAlreadyExists && !existingRefRole) {
        const key = `REF__${n}`;
        // Verificar también que no exista ya en seen (por si acaso)
        if (!seen.has(key)) {
          seen.add(key);
          refs.push({ role: 'REF', name: n });
        }
      }
    }
  }
  
  // Aplicar ordenamiento por jerarquía de roles
  const sortedNormals = sortByRoleHierarchy(normals);
  const sortedRefs = sortByRoleHierarchy(refs);
  return [...sortedNormals, ...sortedRefs];
}

export function buildPeoplePre(
  weekPrelightActive: boolean,
  prelightPeople: Persona[],
  refNamesPre: Set<string>
): PersonaWithBlock[] {
  const normals: PersonaWithBlock[] = [];
  const refs: PersonaWithBlock[] = [];
  const seen = new Set<string>();
  // Track nombres de refuerzos que ya están en prelightPeople (normalizados para comparación)
  const namesInPrelightPeople = new Set<string>();
  const refRolesInPrelightPeople = new Map<string, string>(); // Map nombre -> rol para refuerzos
  // También trackear todos los nombres procesados (no solo refuerzos) para evitar duplicados
  const allNamesInPrelightPeople = new Set<string>();
  
  if (weekPrelightActive) {
    // Procesar todos los miembros, agrupando refuerzos por nombre normalizado
    // para eliminar duplicados y preferir códigos completos sobre REF genérico
    const refsMap = new Map<string, { role: string; name: string; gender?: 'male' | 'female' | 'neutral' }>(); // nombre normalizado -> { role, name }
    
    for (const m of prelightPeople) {
      const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF'));
      let finalRole: string;
      
      if (isRefRole) {
        // Refuerzos: eliminar cualquier sufijo P o R y mantener código base
        const cleanRole = String(m.role || '').replace(/[PR]$/, '').trim();
        if (cleanRole === 'REF' || !cleanRole.startsWith('REF')) {
          finalRole = 'REF';
        } else {
          finalRole = cleanRole; // REFE, REFG, REFBB, etc.
        }
        
        // Agrupar refuerzos por nombre normalizado para eliminar duplicados
        if (m.name) {
          const normalizedName = norm(m.name);
          const existing = refsMap.get(normalizedName);
          if (!existing) {
            // Primera vez que vemos este refuerzo
            refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
          } else if (finalRole !== 'REF' && existing.role === 'REF') {
            // Reemplazar REF genérico con código completo
            refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
          } else if (finalRole === 'REF' && existing.role !== 'REF') {
            // Ya hay código completo, mantener ese y saltar este genérico
            continue;
          } else if (finalRole === existing.role) {
            // Mismo rol, ya está procesado, saltar
            continue;
          }
        } else {
          // Sin nombre, saltar
          continue;
        }
      } else {
        // Roles normales: añadir sufijo P solo si el source lo indica
        const roleStr = String(m.role || '');
        const sourceSuffix =
          (m as any)?.source === 'base'
            ? ''
            : (m as any)?.source === 'pick'
            ? 'R'
            : 'P';
        if (!sourceSuffix) {
          finalRole = roleStr.replace(/[PR]$/, '');
        } else {
          finalRole = roleStr.endsWith(sourceSuffix) ? roleStr : `${roleStr}${sourceSuffix}`;
        }
        const item: PersonaWithBlock = { role: finalRole, name: m.name, gender: (m as any)?.gender, __block: 'pre' };
        const key = `${item.role}__${item.name}__${item.__block || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          normals.push(item);
          if (m.name) {
            allNamesInPrelightPeople.add(norm(m.name));
          }
        }
      }
    }
    
    // Añadir refuerzos procesados (sin duplicados)
    // IMPORTANTE: Solo añadir un refuerzo por nombre normalizado
    const addedRefs = new Set<string>(); // Para trackear nombres normalizados ya añadidos
    for (const { role, name, gender } of refsMap.values()) {
      const normalizedName = norm(name);
      // Verificar que no hayamos añadido ya un refuerzo para este nombre
      if (!addedRefs.has(normalizedName)) {
        const item: PersonaWithBlock = { role, name, gender, __block: 'pre' };
        const key = `${item.role}__${item.name}__${item.__block || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(item);
          allNamesInPrelightPeople.add(normalizedName);
          namesInPrelightPeople.add(normalizedName);
          refRolesInPrelightPeople.set(normalizedName, role);
          addedRefs.add(normalizedName);
        }
      }
    }
    
    // IMPORTANTE: Solo añadir refuerzos de refNamesPre si NO están ya en prelightPeople
    // Esto evita duplicados: si ya tenemos REFE de prelightPeople, no añadir REF de refNamesPre
    // Si refNamesPre está vacío (ya fue filtrado en useWeekData), no hacer nada
    if (refNamesPre.size > 0) {
      for (const n of Array.from(refNamesPre)) {
        const normalizedName = norm(n);
        // Verificar si este nombre ya está en prelightPeople (con cualquier rol, no solo refuerzos)
        // Si ya está, NO añadir el REF genérico
        const nameAlreadyExists = allNamesInPrelightPeople.has(normalizedName);
        
        // También verificar si ya existe un refuerzo con código completo para este nombre
        const existingRefRole = refRolesInPrelightPeople.get(normalizedName);
        
        // Solo añadir REF genérico si:
        // 1. El nombre NO está en prelightPeople
        // 2. Y no hay un refuerzo con código completo para este nombre
        if (!nameAlreadyExists && !existingRefRole) {
          const key = `REF__${n}__pre`;
          // Verificar también que no exista ya en seen (por si acaso)
          if (!seen.has(key)) {
            seen.add(key);
            refs.push({ role: 'REF', name: n, __block: 'pre' });
          }
        }
      }
    }
  }
  
  // Aplicar ordenamiento por jerarquía de roles
  const sortedNormals = sortByRoleHierarchy(normals);
  const sortedRefs = sortByRoleHierarchy(refs);
  return [...sortedNormals, ...sortedRefs];
}

export function buildPeoplePick(
  weekPickupActive: boolean, 
  pickupPeople: Persona[], 
  refNamesPick: Set<string>
): PersonaWithBlock[] {
  const normals: PersonaWithBlock[] = [];
  const refs: PersonaWithBlock[] = [];
  const seen = new Set<string>();
  // Track nombres de refuerzos que ya están en pickupPeople (normalizados para comparación)
  const namesInPickupPeople = new Set<string>();
  const refRolesInPickupPeople = new Map<string, string>(); // Map nombre -> rol para refuerzos
  // También trackear todos los nombres procesados (no solo refuerzos) para evitar duplicados
  const allNamesInPickupPeople = new Set<string>();
  
  if (weekPickupActive) {
    // Procesar todos los miembros, agrupando refuerzos por nombre normalizado
    // para eliminar duplicados y preferir códigos completos sobre REF genérico
    const refsMap = new Map<string, { role: string; name: string; gender?: 'male' | 'female' | 'neutral' }>(); // nombre normalizado -> { role, name }
    
    for (const m of pickupPeople) {
      const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF'));
      let finalRole: string;
      
      if (isRefRole) {
        // Refuerzos: eliminar cualquier sufijo P o R y mantener código base
        const cleanRole = String(m.role || '').replace(/[PR]$/, '').trim();
        if (cleanRole === 'REF' || !cleanRole.startsWith('REF')) {
          finalRole = 'REF';
        } else {
          finalRole = cleanRole; // REFE, REFG, REFBB, etc.
        }
        
        // Agrupar refuerzos por nombre normalizado para eliminar duplicados
        if (m.name) {
          const normalizedName = norm(m.name);
          const existing = refsMap.get(normalizedName);
          if (!existing) {
            // Primera vez que vemos este refuerzo
            refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
          } else if (finalRole !== 'REF' && existing.role === 'REF') {
            // Reemplazar REF genérico con código completo
            refsMap.set(normalizedName, { role: finalRole, name: m.name, gender: (m as any)?.gender });
          } else if (finalRole === 'REF' && existing.role !== 'REF') {
            // Ya hay código completo, mantener ese y saltar este genérico
            continue;
          } else if (finalRole === existing.role) {
            // Mismo rol, ya está procesado, saltar
            continue;
          }
        } else {
          // Sin nombre, saltar
          continue;
        }
      } else {
        // Roles normales: añadir sufijo R solo si el source lo indica
        const roleStr = String(m.role || '');
        const sourceSuffix =
          (m as any)?.source === 'base'
            ? ''
            : (m as any)?.source === 'pre'
            ? 'P'
            : 'R';
        if (!sourceSuffix) {
          finalRole = roleStr.replace(/[PR]$/, '');
        } else {
          finalRole = roleStr.endsWith(sourceSuffix) ? roleStr : `${roleStr}${sourceSuffix}`;
        }
        const item: PersonaWithBlock = { role: finalRole, name: m.name, gender: (m as any)?.gender, __block: 'pick' };
        const key = `${item.role}__${item.name}__${item.__block || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          normals.push(item);
          if (m.name) {
            allNamesInPickupPeople.add(norm(m.name));
          }
        }
      }
    }
    
    // Añadir refuerzos procesados (sin duplicados)
    // IMPORTANTE: Solo añadir un refuerzo por nombre normalizado
    const addedRefs = new Set<string>(); // Para trackear nombres normalizados ya añadidos
    for (const { role, name, gender } of refsMap.values()) {
      const normalizedName = norm(name);
      // Verificar que no hayamos añadido ya un refuerzo para este nombre
      if (!addedRefs.has(normalizedName)) {
        const item: PersonaWithBlock = { role, name, gender, __block: 'pick' };
        const key = `${item.role}__${item.name}__${item.__block || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(item);
          allNamesInPickupPeople.add(normalizedName);
          namesInPickupPeople.add(normalizedName);
          refRolesInPickupPeople.set(normalizedName, role);
          addedRefs.add(normalizedName);
        }
      }
    }
    
    // IMPORTANTE: Solo añadir refuerzos de refNamesPick si NO están ya en pickupPeople
    // Esto evita duplicados: si ya tenemos REFE de pickupPeople, no añadir REF de refNamesPick
    // Si refNamesPick está vacío (ya fue filtrado en useWeekData), no hacer nada
    if (refNamesPick.size > 0) {
      for (const n of Array.from(refNamesPick)) {
        const normalizedName = norm(n);
        // Verificar si este nombre ya está en pickupPeople (con cualquier rol, no solo refuerzos)
        // Si ya está, NO añadir el REF genérico
        const nameAlreadyExists = allNamesInPickupPeople.has(normalizedName);
        
        // También verificar si ya existe un refuerzo con código completo para este nombre
        const existingRefRole = refRolesInPickupPeople.get(normalizedName);
        
        // Solo añadir REF genérico si:
        // 1. El nombre NO está en pickupPeople
        // 2. Y no hay un refuerzo con código completo para este nombre
        if (!nameAlreadyExists && !existingRefRole) {
          const key = `REF__${n}__pick`;
          // Verificar también que no exista ya en seen (por si acaso)
          if (!seen.has(key)) {
            seen.add(key);
            refs.push({ role: 'REF', name: n, __block: 'pick' });
          }
        }
      }
    }
  }
  
  // Aplicar ordenamiento por jerarquía de roles
  const sortedNormals = sortByRoleHierarchy(normals);
  const sortedRefs = sortByRoleHierarchy(refs);
  return [...sortedNormals, ...sortedRefs];
}

export function collectRefNamesForBlock(
  safeSemana: string[], 
  findWeekAndDay: (iso: string) => WeekAndDay, 
  listKey: string
): Set<string> {
  const set = new Set<string>();
  for (const iso of safeSemana) {
    const { day } = findWeekAndDay(iso);
    const lst = day?.[listKey] || [];
    for (const m of lst) {
      if (m && isMemberRefuerzo(m) && m.name) set.add(m.name);
    }
  }
  return set;
}

/**
 * Collect refuerzo names and their full role codes from a block
 * Returns a Map: normalized name -> { role: string, name: string }
 */
export function collectRefRolesForBlock(
  safeSemana: string[], 
  findWeekAndDay: (iso: string) => WeekAndDay, 
  listKey: string
): Map<string, { role: string; name: string }> {
  const map = new Map<string, { role: string; name: string }>();
  for (const iso of safeSemana) {
    const { day } = findWeekAndDay(iso);
    const lst = day?.[listKey] || [];
    for (const m of lst) {
      if (m && isMemberRefuerzo(m) && m.name) {
        const originalRole = String(m.role || '').trim();
        // Limpiar cualquier sufijo P o R
        const cleanRole = originalRole.replace(/[PR]$/, '').trim();
        let finalRole: string;
        if (cleanRole === 'REF' || !cleanRole.startsWith('REF')) {
          finalRole = 'REF';
        } else {
          finalRole = cleanRole; // REFE, REFG, REFBB, etc.
        }
        
        const normalizedName = norm(m.name);
        const existing = map.get(normalizedName);
        // Preferir códigos completos sobre REF genérico
        if (!existing) {
          map.set(normalizedName, { role: finalRole, name: m.name });
        } else if (finalRole !== 'REF' && existing.role === 'REF') {
          // Reemplazar REF genérico con código completo
          map.set(normalizedName, { role: finalRole, name: m.name });
        } else if (finalRole === 'REF' && existing.role !== 'REF') {
          // Ya hay código completo, mantener ese
          // No hacer nada
        }
      }
    }
  }
  return map;
}

export function horarioPrelightFactory(findWeekAndDay: (iso: string) => WeekAndDay) {
  return function horarioPrelight(iso: string): string {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '—';
    if (!day.prelightStart || !day.prelightEnd)
      return 'Añadelo en Planificación';
    return `${day.prelightStart}–${day.prelightEnd}`;
  };
}

export function horarioPickupFactory(findWeekAndDay: (iso: string) => WeekAndDay) {
  return function horarioPickup(iso: string): string {
    const { day } = findWeekAndDay(iso);
    if (!day || day.tipo === 'Descanso') return '—';
    if (!day.pickupStart || !day.pickupEnd) return 'Añadelo en Planificación';
    return `${day.pickupStart}–${day.pickupEnd}`;
  };
}
