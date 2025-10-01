import { loadCondModel } from './cond';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD } from './date';
import { parseNum, parseDietasValue } from './parse';
import { stripPR, buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from './plan';

export function makeRolePrices(project: any) {
  const model = loadCondModel(project);
  const priceRows = model?.prices || {};
  const p = model?.params || {};

  // Debug: log the loaded data
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA] makeRolePrices - model:', model);
    console.debug('[NOMINA] makeRolePrices - priceRows:', priceRows);
    console.debug('[NOMINA] makeRolePrices - params:', p);
  }

  const num = (v: unknown) => {
    if (v == null || v === '') return 0;
    const s = String(v)
      .trim()
      .replace(/\u00A0/g, '')
      .replace(/[€%]/g, '')
      .replace(/\s+/g, '');
    const t =
      s.includes(',') && s.includes('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(',', '.');
    const n = Number(t);
    return isFinite(n) ? n : 0;
  };

  const normalizeStr = (s: unknown): string =>
    String(s == null ? '' : s)
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const findPriceRow = (candidates: string[]) => {
    // 1) Exactos primero
    for (const cand of candidates) {
      if (cand && priceRows[cand]) return { row: priceRows[cand], key: cand };
    }
    // 2) Match insensible a acentos/mayúsculas/sufijo P/R
    const candNorms = candidates.map(c => normalizeStr(c));
    for (const key of Object.keys(priceRows)) {
      const keyNorm = normalizeStr(key);
      if (candNorms.includes(keyNorm)) return { row: priceRows[key], key };
    }
    // 3) Intento extra: si keys vienen con sufijo P/R, comparar sin sufijo
    for (const key of Object.keys(priceRows)) {
      const keyBaseNorm = normalizeStr(String(key).replace(/[PR]$/i, ''));
      if (candNorms.includes(keyBaseNorm)) return { row: priceRows[key], key };
    }
    return { row: {} as any, key: '' };
  };

  // Intenta obtener un número desde una fila probando varias variantes de nombre de columna
  const getNumField = (row: any, candidates: string[]): number => {
    if (!row || typeof row !== 'object') return 0;
    
    // Debug: log what we're looking for and what we have
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA] getNumField - candidates:', candidates);
      console.debug('[NOMINA] getNumField - row keys:', Object.keys(row));
      console.debug('[NOMINA] getNumField - row:', row);
    }
    
    for (const key of candidates) {
      const direct = row[key];
      if ((import.meta as any).env.DEV) {
        console.debug(`[NOMINA] getNumField - trying direct key "${key}":`, direct);
      }
      if (direct != null && direct !== '') return num(direct);
    }
    // Búsqueda case-insensitive por si cambian mayúsculas/acentos
    const lowerToValue = new Map<string, unknown>();
    for (const k of Object.keys(row)) lowerToValue.set(k.toLowerCase(), row[k]);
    for (const key of candidates) {
      const v = lowerToValue.get(key.toLowerCase());
      if ((import.meta as any).env.DEV) {
        console.debug(`[NOMINA] getNumField - trying lowercase "${key.toLowerCase()}":`, v);
      }
      if (v != null && v !== '') return num(v);
    }
    return 0;
  };

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm =
      String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    // Debug: log role processing
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA] getForRole - roleCode:', roleCode, 'baseRoleCode:', baseRoleCode);
      console.debug('[NOMINA] getForRole - normalized:', normalized, 'baseNorm:', baseNorm);
    }

    const pickedRow = findPriceRow([normalized]);
    const row = pickedRow.row;
    const pickedBase = findPriceRow([baseNorm]);
    const baseRow = pickedBase.row;
    const pickedElec = findPriceRow(['Eléctrico', 'Electrico', 'E']);
    const elecRow = pickedElec.row;

    // Debug: log row selection
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA] getForRole - row for', normalized, '=> key:', pickedRow.key, row);
      console.debug('[NOMINA] getForRole - baseRow for', baseNorm, '=> key:', pickedBase.key, baseRow);
      console.debug('[NOMINA] getForRole - elecRow => key:', pickedElec.key, elecRow);
    }

    const divTravel = num(p.divTravel) || 2;

    let jornada, travelDay, horaExtra;
    if (normalized === 'REF') {
      const refFromBase = getNumField(baseRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const baseJornada = getNumField(baseRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
      const elecRef = getNumField(elecRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const elecJor = getNumField(elecRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
      jornada = refFromBase || baseJornada || elecRef || elecJor || 0;
      const travelBase = getNumField(baseRow, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']);
      travelDay = travelBase || (jornada ? jornada / divTravel : 0);
      horaExtra =
        getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        getNumField(baseRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        0;
    } else {
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA] getForRole - calculating for non-REF role:', normalized);
      }
      jornada = getNumField(row, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']) || 0;
      travelDay = getNumField(row, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) || (jornada ? jornada / divTravel : 0);
      horaExtra = getNumField(row, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
      
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA] getForRole - calculated values:', { jornada, travelDay, horaExtra });
      }
    }

    const result = {
      jornada,
      travelDay,
      horaExtra,
      transporte: num(p.transporteDia),
      km: num(p.kilometrajeKm),
      dietas: {
        Comida: num(p.dietaComida),
        Cena: num(p.dietaCena),
        'Dieta sin pernoctar': num(p.dietaSinPernocta),
        'Dieta completa + desayuno': num(p.dietaAlojDes),
        'Gastos de bolsillo': num(p.gastosBolsillo),
      },
    };

    // Debug: log final result
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA] getForRole - result for', roleCode, ':', result);
    }

    return result;
  };

  return { getForRole };
}

// === Shared helpers for reading Reportes data robustly ===
const storageKeyVariants = (storageKey: string): string[] => {
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
};

// Deprecated: usamos getCellValueCandidates

// Permite probar variantes de nombre de columna (case/acentos/abreviaturas)
const getCellValueCandidates = (
  dataObj: any,
  storageKeys: string[],
  colNames: readonly string[],
  iso: string
) => {
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
      const low = String(k)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
      toKey.set(low, k);
    }
    for (const cn of colNames) {
      const low = String(cn)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
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
};

// Nueva función que SUMA todos los valores encontrados en lugar de solo devolver el primero
const getCellValueSum = (
  dataObj: any,
  storageKeys: string[],
  colNames: readonly string[],
  iso: string
) => {
  if (isDev()) {
    console.debug('[NOMINA.GCVS]', 'Summing', colNames, 'on', iso, 'in keys:', storageKeys);
  }
  let total = 0;
  let foundAny = false;
  
  for (const sk of storageKeys) {
    const cols = dataObj?.[sk];
    if (!cols) continue;
    
    // 1) Directo
    for (const cn of colNames) {
      const v = cols?.[cn]?.[iso];
      if (v != null && v !== '') {
        const num = parseFloat(String(v)) || 0;
        if (num > 0) {
          total += num;
          foundAny = true;
          if (isDev()) console.debug('[NOMINA.GCVS]', 'Adding direct:', sk, cn, iso, '=', v, 'total=', total);
        }
      }
    }
    
    // 2) Normalizado a lowercase sin tildes
    const toKey = new Map<string, string>();
    for (const k of Object.keys(cols)) {
      const low = String(k)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
      toKey.set(low, k);
    }
    for (const cn of colNames) {
      const low = String(cn)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
      const real = toKey.get(low);
      if (real) {
        const v = cols?.[real]?.[iso];
        if (v != null && v !== '') {
          const num = parseFloat(String(v)) || 0;
          if (num > 0) {
            total += num;
            foundAny = true;
            if (isDev()) console.debug('[NOMINA.GCVS]', 'Adding normalized:', sk, real, iso, '=', v, 'total=', total);
          }
        }
      }
    }
  }
  
  if (isDev()) console.debug('[NOMINA.GCVS]', 'Final sum for', colNames, 'on', iso, '=', total);
  return foundAny ? total : undefined;
};

const valIsYes = (v: unknown): boolean => {
  const s = String(v || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
  return s === 'SI' || s === 'YES' || s === 'TRUE' || s === '1';
};

const isDev = () => {
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
};

const dbgLog = (...args: any[]) => {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.debug('[NOMINA.AGG]', ...args);
  }
};

export function aggregateReports(project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null = null) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

  const storageKeyFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`;
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    const roleForKey = suffix ? `${base}${suffix}` : base;
    return `${roleForKey}__${name || ''}`;
  };

  const visibleRoleFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return 'REF';
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    return suffix ? `${base}${suffix}` : base;
  };

  // Usamos la función global storageKeyVariants que tiene todas las variantes
  // Deprecated: usamos getCellValueCandidates

  const ensure = (role: string, name: string) => {
    const k = `${role}__${name}`;
    if (!totals.has(k)) {
      totals.set(k, {
        role,
        name,
        extras: 0,
        transporte: 0,
        km: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
      });
    }
    return totals.get(k);
  };

  for (const w of weeks) {
    const isoDays = weekISOdays(w);
    const days = filterISO ? isoDays.filter(filterISO) : isoDays;
    if (days.length === 0) continue;

    const weekKey = `reportes_${base}_${isoDays.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}
    
    // Debug temporal: mostrar qué datos hay en Reportes para esta semana
    if (isDev()) {
      console.log(`[NOMINA.DEBUG] Semana ${weekKey}:`, data);
      console.log(`[NOMINA.DEBUG] Claves disponibles:`, Object.keys(data || {}));
      
      // Buscar específicamente datos para "cccc"
      const ccccKeys = Object.keys(data || {}).filter(k => k.includes('cccc'));
      console.log(`[NOMINA.DEBUG] Claves que contienen "cccc":`, ccccKeys);
      
      for (const key of ccccKeys) {
        console.log(`[NOMINA.DEBUG] Datos para ${key}:`, data[key]);
        if (data[key]) {
          for (const col of Object.keys(data[key])) {
            console.log(`[NOMINA.DEBUG] Columna ${col} en ${key}:`, data[key][col]);
          }
        }
      }
    }

    const rawPeople = weekAllPeopleActive(w);

    const uniqStorageKeys = new Map<string, { roleVisible: string; name: string }>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const roleVisible = visibleRoleFor(r, n);
      if (roleVisible === 'REF') {
        // Admitimos claves separadas por bloque en Reportes
        const keys = [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`];
        for (const sk of keys) if (!uniqStorageKeys.has(sk)) uniqStorageKeys.set(sk, { roleVisible, name: n });
      } else {
        const storageKey = storageKeyFor(r, n);
        if (!uniqStorageKeys.has(storageKey)) {
          uniqStorageKeys.set(storageKey, { roleVisible, name: n });
        }
      }
    }

  // Nota: nombres originales conservados arriba en colCandidates

  const colCandidates = {
    extras: ['Horas extra', 'Horas extras', 'HE'] as const,
    ta: ['Turn Around', 'TA'] as const,
    noct: ['Nocturnidad', 'Noct', 'Nocturnidades'] as const,
    dietas: ['Dietas', 'Dietas / Ticket', 'Ticket', 'Tickets'] as const,
    km: ['Kilometraje', 'KM', 'Km'] as const,
    transp: ['Transporte', 'Transportes'] as const,
    penalty: ['Penalty lunch', 'Penalty Lunch', 'Penalty', 'PL'] as const,
  } as const;

    for (const [pk, info] of uniqStorageKeys) {
      const slot = ensure(info.roleVisible, info.name);
      for (const iso of days) {
        // Variantes para todos los NO-REF; REF solo su clave original
        const keysToUse = info.roleVisible === 'REF' ? [pk] : storageKeyVariants(pk);
        dbgLog('week agg person=', info.name, 'roleVis=', info.roleVisible, 'pk=', pk, 'iso=', iso, 'keysToUse=', keysToUse);
        
        const he = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        slot.extras += he + ta;
        const nVal = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const nYes = valIsYes(nVal);
        if (nYes) slot.extras += 1;
        const pVal = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const pYes = valIsYes(pVal);
        if (pYes) slot.extras += 1;
        const tVal = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const tYes = valIsYes(tVal);
        if (tYes) slot.transporte += 1;
        dbgLog('iso', iso, 'he', he, 'ta', ta, 'noct', nVal, 'noctYes', nYes, 'pen', pVal, 'penYes', pYes, 'transp', tVal, 'transpYes', tYes);
        slot.km += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        
        // Para dietas, usar solo la clave original para evitar "comida" fantasma
        const dVal = getCellValueCandidates(data, [pk], colCandidates.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
    }
  }

  const order: Record<string, number> = { G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6, REF: 7 };
  return Array.from(totals.values()).sort(
    (a, b) =>
      (order[a.role] ?? 99) - (order[b.role] ?? 99) ||
      a.name.localeCompare(b.name, 'es')
  );
}

export function getCondParams(project: any) {
  const m = loadCondModel(project);
  return m?.params || {};
}

export function getOvertimeWindowForPayrollMonth(monthKey: string, params: any) {
  const [Y, M] = monthKey.split('-').map(Number);
  const ini = parseInt(params?.heCierreIni, 10);
  const fin = parseInt(params?.heCierreFin, 10);
  if (
    !Number.isInteger(ini) ||
    !Number.isInteger(fin) ||
    ini < 1 ||
    ini > 31 ||
    fin < 1 ||
    fin > 31
  )
    return null;
  const start = new Date(Y, M - 1 - 1, ini, 0, 0, 0, 0);
  const end = new Date(Y, M - 1, fin, 23, 59, 59, 999);
  return { start, end };
}

export function isoInRange(iso: string, start: Date, end: Date) {
  const d = parseYYYYMMDD(iso);
  return d >= start && d <= end;
}

export function aggregateWindowedReport(project: any, weeks: any[], filterISO: (iso: string) => boolean) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

  const storageKeyFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return `REF__${name || ''}`;
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    const roleForKey = suffix ? `${base}${suffix}` : base;
    return `${roleForKey}__${name || ''}`;
  };

  const visibleRoleFor = (roleCode: string, name: string) => {
    const base = stripPR(roleCode || '');
    const keyNoPR = `${base}__${name || ''}`;
    if (refuerzoSet.has(keyNoPR)) return 'REF';
    const suffix = /[PR]$/.test(roleCode || '') ? roleCode.slice(-1) : '';
    return suffix ? `${base}${suffix}` : base;
  };

  const ensure = (visibleKey: string) => {
    if (!totals.has(visibleKey)) {
      totals.set(visibleKey, {
        extras: 0,
        transporte: 0,
        km: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
      });
    }
    return totals.get(visibleKey);
  };

  for (const w of weeks) {
    const isoDaysFull = weekISOdays(w);
    const isoDays = filterISO ? isoDaysFull.filter(filterISO) : isoDaysFull;
    if (isoDays.length === 0) continue;

    const weekKey = `reportes_${base}_${isoDaysFull.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, string>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const vk = visibleRoleFor(r, n);
      if (vk === 'REF') {
        // Claves posibles en Reportes por bloque
        for (const sk of [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`]) {
          if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
        }
      } else {
        const sk = storageKeyFor(r, n);
        if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
      }
    }

  // Nota: nombres originales conservados arriba en colCandidates
  const colCandidates = {
    extras: ['Horas extra', 'Horas extras', 'HE'] as const,
    ta: ['Turn Around', 'TA'] as const,
    noct: ['Nocturnidad', 'Noct', 'Nocturnidades'] as const,
    dietas: ['Dietas', 'Dietas / Ticket', 'Ticket', 'Tickets'] as const,
    km: ['Kilometraje', 'KM', 'Km'] as const,
    transp: ['Transporte', 'Transportes'] as const,
    penalty: ['Penalty lunch', 'Penalty Lunch', 'Penalty', 'PL'] as const,
  } as const;
    for (const [storageKey, visibleKey] of uniqStorage) {
      const slot = ensure(visibleKey);
      for (const iso of isoDays) {
        // Variantes para todos los NO-REF; REF solo su clave original
        const keysToUse = visibleKey === 'REF' ? [storageKey] : storageKeyVariants(storageKey);
        dbgLog('window agg roleVis=', visibleKey, 'sk=', storageKey, 'iso=', iso, 'keysToUse=', keysToUse);
        
        slot.extras += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        slot.extras += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        const nVal = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const nYes = valIsYes(nVal);
        if (nYes) slot.extras += 1;
        const pVal = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const pYes = valIsYes(pVal);
        if (pYes) slot.extras += 1;
        const tVal = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const tYes = valIsYes(tVal);
        if (tYes) slot.transporte += 1;
        dbgLog('iso', iso, 'he+', 'ta added', 'noct', nVal, 'noctYes', nYes, 'pen', pVal, 'penYes', pYes, 'transp', tVal, 'transpYes', tYes);
        slot.km += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        
        // Para dietas, usar solo la clave original para evitar "comida" fantasma
        const dVal = getCellValueCandidates(data, [storageKey], colCandidates.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
    }
  }

  return totals;
}


