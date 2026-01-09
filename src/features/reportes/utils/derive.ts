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
        const role = isRef ? 'REF' : `${m.role || ''}${suffix}`;
        const name = m.name || '';
        const key = `${role}__${name}`;
        if (!set.has(key)) {
          set.add(key);
          out.push({ role, name });
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
      const item: Persona = isRef
        ? { role: 'REF', name: m.name || '', __block: block }
        : { role: m.role || '', name: m.name || '', __block: block };
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

  // Normalizar roles REF
  for (let i = 0; i < base.length; i++) {
    const r = String(personaRole(base[i]) || '');
    const n = String(personaName(base[i]) || '');
    const blk = (base[i] as any)?.__block;
    if (r.startsWith('REF')) base[i] = blk ? { role: 'REF', name: n, __block: blk } : { role: 'REF', name: n };
  }

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

export function buildPeopleBase(providedPersonas: Persona[], refNamesBase: Set<string>): Persona[] {
  const base = (Array.isArray(providedPersonas) ? providedPersonas : [])
    .filter(p => !/[PR]$/.test(personaRole(p) || ''))
    .map(p => ({ role: personaRole(p) || '', name: personaName(p) || '' }));
  for (const n of Array.from(refNamesBase)) base.push({ role: 'REF', name: n });
  const seen = new Set<string>();
  const filtered = base.filter(p => {
    const k = `${p.role}__${p.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  
  // Aplicar ordenamiento por jerarquía de roles
  return sortByRoleHierarchy(filtered);
}

export function buildPeoplePre(
  weekPrelightActive: boolean,
  prelightPeople: Persona[],
  refNamesPre: Set<string>
): PersonaWithBlock[] {
  const normals: PersonaWithBlock[] = [];
  const refs: PersonaWithBlock[] = [];
  const seen = new Set<string>();
  if (weekPrelightActive) {
    for (const m of prelightPeople) {
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), normalizar a 'REF'
      const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF') && m.role.length > 3);
      const item: PersonaWithBlock =
        isRefRole
          ? { role: 'REF', name: m.name, __block: 'pre' }
          : { role: m.role, name: m.name, __block: 'pre' };
      const key = `${item.role}__${item.name}__${item.__block || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      (item.role === 'REF' ? refs : normals).push(item);
    }
    for (const n of Array.from(refNamesPre)) {
      const key = `REF__${n}__pre`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ role: 'REF', name: n, __block: 'pre' });
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
  if (weekPickupActive) {
    for (const m of pickupPeople) {
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), normalizar a 'REF'
      const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF') && m.role.length > 3);
      const item: PersonaWithBlock =
        isRefRole
          ? { role: 'REF', name: m.name, __block: 'pick' }
          : { role: m.role, name: m.name, __block: 'pick' };
      const key = `${item.role}__${item.name}__${item.__block || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      (item.role === 'REF' ? refs : normals).push(item);
    }
    for (const n of Array.from(refNamesPick)) {
      const key = `REF__${n}__pick`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ role: 'REF', name: n, __block: 'pick' });
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
