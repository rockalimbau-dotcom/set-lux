// Helpers de persona y modelo base para Reportes Semana

export const stripPR = (r: string): string => String(r || '').replace(/[PR]$/, '');

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
  const role = stripPR(personaRole(p) || '');
  const name = personaName(p) || '';
  if (role.startsWith('REF')) {
    const block = (p && (p.__block || p.block)) || '';
    if (block === 'pre') return `REF.pre__${name}`;
    if (block === 'pick') return `REF.pick__${name}`;
    return `REF__${name}`;
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
