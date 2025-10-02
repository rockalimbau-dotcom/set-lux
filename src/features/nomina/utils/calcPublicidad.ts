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
    console.debug('[NOMINA.PUBLICIDAD] makeRolePrices - model:', model);
    console.debug('[NOMINA.PUBLICIDAD] makeRolePrices - priceRows:', priceRows);
    console.debug('[NOMINA.PUBLICIDAD] makeRolePrices - params:', p);
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
      for (const candNorm of candNorms) {
        if (keyNorm === candNorm) return { row: priceRows[key], key };
      }
    }
    return { row: {}, key: '' };
  };

const getNumField = (row: any, candidates: readonly string[]) => {
    // 1) Directo
    for (const cand of candidates) {
      if (cand && row[cand] != null) {
        const val = num(row[cand]);
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] getNumField - trying direct key "' + cand + '":', val);
        }
        if (val > 0) return val;
      }
    }
    // 2) Insensible a acentos/mayúsculas
    const candNorms = candidates.map(c => normalizeStr(c));
    for (const key of Object.keys(row)) {
      const keyNorm = normalizeStr(key);
      for (const candNorm of candNorms) {
        if (keyNorm === candNorm) {
          const val = num(row[key]);
          if ((import.meta as any).env.DEV) {
            console.debug('[NOMINA.PUBLICIDAD] getNumField - trying lowercase "' + candNorm + '":', val);
          }
          if (val > 0) return val;
        }
      }
    }
    return 0;
  };

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm =
      String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    // Debug: log role processing
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - roleCode:', roleCode, 'baseRoleCode:', baseRoleCode);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - normalized:', normalized, 'baseNorm:', baseNorm);
    }

    const pickedRow = findPriceRow([normalized]);
    const row = pickedRow.row;
    const pickedBase = findPriceRow([baseNorm]);
    const baseRow = pickedBase.row;
    const pickedElec = findPriceRow(['Eléctrico', 'Electrico', 'E']);
    const elecRow = pickedElec.row;

    // Debug: log row selection
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - row for', normalized, '=> key:', pickedRow.key, row);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - baseRow for', baseNorm, '=> key:', pickedBase.key, baseRow);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - elecRow => key:', pickedElec.key, elecRow);
    }

    // Para publicidad, el divisor de travel puede ser diferente
    const divTravel = num(p.divTravel) || 2.5; // Publicidad usa divisor 2.5

    let jornada, travelDay, horaExtra, holidayDay;
    if (normalized === 'REF') {
      const refFromBase = getNumField(baseRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const refFromElec = getNumField(elecRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      jornada = refFromBase || refFromElec || 0;
      travelDay = jornada / divTravel;
      horaExtra = getNumField(baseRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
                  getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
      holidayDay = getNumField(baseRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
                   getNumField(elecRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
    } else {
      jornada = getNumField(row, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
      travelDay = getNumField(row, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) ||
                  (jornada > 0 ? jornada / divTravel : 0);
      horaExtra = getNumField(row, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']);
      holidayDay = getNumField(row, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
    }

    // Debug: log calculated values
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - calculated values:', { jornada, travelDay, horaExtra });
    }

    const result = {
      jornada,
      travelDay,
      horaExtra,
      holidayDay,
      transporte: num(p.transporteDia) || 0,
      km: num(p.kilometrajeKm) || 0,
      dietas: {
        Comida: num(p.dietaComida) || 0,
        Cena: num(p.dietaCena) || 0,
        'Dieta sin pernoctar': num(p.dietaSinPernocta) || 0,
        'Dieta completa + desayuno': num(p.dietaAlojDes) || 0,
        'Gastos de bolsillo': num(p.gastosBolsillo) || 0,
      },
    };

    // Debug: log final result
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - result for', roleCode, ':', result);
    }

    return result;
  };

  return { getForRole };
}

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
    const filteredDays = filterISO ? isoDays.filter(filterISO) : isoDays;
    if (filteredDays.length === 0) continue;

    const weekKey = `reportes_${base}_${isoDays.join('_')}`;
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

    // Debug: log week data
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] Semana', weekKey + ':', data);
      console.debug('[NOMINA.PUBLICIDAD] Claves disponibles:', Object.keys(data));
      console.debug('[NOMINA.PUBLICIDAD] Claves que contienen "cccc":', Object.keys(data).filter(k => k.includes('cccc')));
    }

    for (const [storageKey, visibleKey] of uniqStorage) {
      const pk = storageKey;
      const roleVis = visibleKey;
      const personName = pk.split('__')[1] || '';

      // Debug: log storage key variants
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.PUBLICIDAD]', pk, '=>', storageKeyVariants(pk).length, 'variants:', storageKeyVariants(pk));
      }

      for (const iso of filteredDays) {
        const keysToUse = storageKeyVariants(pk);
        
        // Debug: log aggregation
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] week agg person=', personName, 'roleVis=', roleVis, 'pk=', pk, 'iso=', iso, 'keysToUse=', keysToUse);
        }

        const slot = ensure(roleVis, personName);

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

        const he = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === 1;
        const pen = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === 1;
        const transp = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === 1;

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he', he, 'ta', ta, 'noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
        }

        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0);
        slot.transporte += transpYes ? 1 : 0;

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

  const order: Record<string, number> = { 
    // EQUIPO BASE
    G: 0, BB: 1, E: 2, TM: 3, FB: 4, AUX: 5, M: 6,
    // REFUERZOS
    REF: 7,
    // EQUIPO PRELIGHT
    GP: 8, BBP: 9, EP: 10, TMP: 11, FBP: 12, AUXP: 13, MP: 14,
    // EQUIPO RECOGIDA
    GR: 15, BBR: 16, ER: 17, TMR: 18, FBR: 19, AUXR: 20, MR: 21
  };
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

export function getOvertimeWindowForPayrollMonth(project: any, monthKey: string) {
  const params = getCondParams(project);
  const windowDays = parseNum(params.overtimeWindowDays) || 0;
  if (windowDays <= 0) return null;

  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return { start, end, days: windowDays };
}

export function isoInRange(iso: string, start: Date, end: Date) {
  const d = parseYYYYMMDD(iso);
  if (!d) return false;
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
      const pk = storageKey;
      const roleVis = visibleKey;
      const keysToUse = storageKeyVariants(pk);
      for (const iso of isoDays) {
        const slot = ensure(visibleKey);
        const he = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === 1;
        const pen = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === 1;
        const transp = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === 1;

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he+ ta added noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
        }

        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0);
        slot.transporte += transpYes ? 1 : 0;

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

  return totals;
}

// Función para generar variantes de claves de almacenamiento
function storageKeyVariants(baseKey: string): string[] {
  const variants = [baseKey];
  
  // Si es una clave con sufijo, agregar variantes sin sufijo
  if (/[PR]__/.test(baseKey)) {
    const withoutSuffix = baseKey.replace(/[PR]__/, '__');
    variants.push(withoutSuffix);
  }
  
  // Si es una clave sin sufijo, agregar variantes con sufijos
  if (/^[A-Z]+__/.test(baseKey)) {
    const [role, name] = baseKey.split('__');
    variants.push(`${role}P__${name}`, `${role}R__${name}`);
  }
  
  // Agregar variantes con puntos
  for (const variant of [...variants]) {
    if (variant.includes('__')) {
      const withDots = variant.replace(/^([A-Z]+)([PR]?)__/, '$1.$2__');
      variants.push(withDots);
    }
  }
  
  // Agregar variantes con guiones bajos
  for (const variant of [...variants]) {
    if (variant.includes('.')) {
      const withUnderscores = variant.replace(/\./, '_');
      variants.push(withUnderscores);
    }
  }
  
  return [...new Set(variants)]; // Eliminar duplicados
}

// Función para obtener valores de celdas con múltiples candidatos
function getCellValueCandidates(data: any, storageKeys: string[], columnCandidates: readonly string[], iso: string): string | undefined {
  // Priorizar claves específicas (que contienen .pre__ o .pick__) sobre genéricas
  const prioritizedKeys = [...storageKeys].sort((a, b) => {
    const aSpecific = a.includes('.pre__') || a.includes('.pick__');
    const bSpecific = b.includes('.pre__') || b.includes('.pick__');
    if (aSpecific && !bSpecific) return -1;
    if (!aSpecific && bSpecific) return 1;
    return 0;
  });

  // Debug: log search process
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.PUBLICIDAD] Looking for', columnCandidates, 'on', iso, 'in keys:', prioritizedKeys);
  }

  for (const key of prioritizedKeys) {
    const personData = data[key];
    if (!personData) {
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.PUBLICIDAD] No data for key:', key);
      }
      continue;
    }

    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] Found data for key:', key, 'columns:', Object.keys(personData));
    }

    for (const col of columnCandidates) {
      const colData = personData[col];
      if (colData && colData[iso] != null && colData[iso] !== '') {
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] Found direct match:', key, col, iso, '=', colData[iso]);
        }
        return String(colData[iso]);
      }
    }
  }

  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.PUBLICIDAD] No match found for', columnCandidates, 'on', iso);
  }
  return undefined;
}
