import { loadCondModel } from './cond';
import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD } from './date';
import { parseNum, parseDietasValue, parseHorasExtra } from './parse';
import { stripPR, buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from './plan';
import { ROLE_CODE_TO_LABEL } from '@shared/constants/roles';

export function makeRolePrices(project: any) {
  // Forzar el modo a publicidad para que loadCondModel cargue las condiciones correctas
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'publicidad'
    }
  };
  
  const model = loadCondModel(projectWithMode, 'publicidad');
  let priceRows = model?.prices || {};
  let p = model?.params || {};

  // Fallback absoluto: si por cualquier motivo aún no hay precios en el modelo,
  // usar una tabla por defecto para que Nómina funcione desde el primer render.
  if (!priceRows || Object.keys(priceRows).length === 0) {
    priceRows = {
      'Gaffer': {
        'Precio jornada': '510',
        'Precio Día extra/Festivo': '892.5',
        'Travel day': '510',
        'Horas extras': '75',
        'Carga/descarga': '225',
        'Localización técnica': '420',
      },
      'Best boy': {
        'Precio jornada': '410',
        'Precio Día extra/Festivo': '717.5',
        'Travel day': '410',
        'Horas extras': '60',
        'Carga/descarga': '180',
        'Localización técnica': '320',
      },
      'Eléctrico': {
        'Precio jornada': '310',
        'Precio Día extra/Festivo': '542.5',
        'Travel day': '310',
        'Horas extras': '45',
        'Carga/descarga': '135',
      },
      'Auxiliar': {
        'Precio jornada': '250',
        'Precio Día extra/Festivo': '437.5',
        'Travel day': '250',
        'Horas extras': '35',
        'Carga/descarga': '105',
      },
      'Técnico de mesa': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
      'Finger boy': {
        'Precio jornada': '350',
        'Precio Día extra/Festivo': '612.5',
        'Travel day': '350',
        'Horas extras': '50',
        'Carga/descarga': '150',
      },
    } as any;

    // Persistir inmediatamente para que el resto de la app vea estos valores
    try {
      const baseKey = projectWithMode?.id || projectWithMode?.nombre || 'tmp';
      const condKey = `cond_${baseKey}_publicidad`;
      const current = storage.getJSON<any>(condKey) || {};
      storage.setJSON(condKey, {
        ...current,
        prices: {
          ...(current?.prices || {}),
          ...priceRows,
        },
      });
    } catch {}
  }

  if (!p || Object.keys(p).length === 0) {
    p = {
      jornadaTrabajo: '10',
      jornadaComida: '1',
      factorFestivo: '1.75',
      factorHoraExtraFestiva: '1.5',
      cortesiaMin: '15',
      taDiario: '10',
      taFinde: '12',
      nocturnidadComplemento: '50',
      nocturnoIni: '02:00',
      nocturnoFin: '06:00',
      dietaDesayuno: '10',
      dietaComida: '20',
      dietaCena: '30',
      dietaSinPernocta: '50',
      dietaAlojDes: '60',
      gastosBolsillo: '10',
      kilometrajeKm: '0.40',
      transporteDia: '15',
    } as any;

    // Persistir params por defecto también
    try {
      const baseKey = projectWithMode?.id || projectWithMode?.nombre || 'tmp';
      const condKey = `cond_${baseKey}_publicidad`;
      const current = storage.getJSON<any>(condKey) || {};
      storage.setJSON(condKey, {
        ...current,
        params: {
          ...(current?.params || {}),
          ...p,
        },
      });
    } catch {}
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
    let row = pickedRow.row;
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
      // Fallback: si no encontramos fila directa para el rol, usar la de Eléctrico
      if (!row || Object.keys(row).length === 0) {
        row = (Object.keys(baseRow || {}).length > 0 ? baseRow : elecRow) as any;
      }
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
        Desayuno: num(p.dietaDesayuno) || 0,
        Comida: num(p.dietaComida) || 0,
        Cena: num(p.dietaCena) || 0,
        'Dieta sin pernoctar': num(p.dietaSinPernocta) || 0,
        'Dieta completa + desayuno': num(p.dietaAlojDes) || 0,
        'Gastos de bolsillo': num(p.gastosBolsillo) || 0,
      },
      // Campos específicos de publicidad
      cargaDescarga: getNumField(row, ['Carga/descarga', 'Carga descarga', 'Carga/Descarga', 'Carga y descarga']) || 0,
      localizacionTecnica: getNumField(row, ['Localización técnica', 'Localizacion tecnica', 'Localización', 'Localizacion']) || 0,
      factorHoraExtraFestiva: num(p.factorHoraExtraFestiva) || 1.5,
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

  // Obtener los roles que están definidos en condiciones
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'publicidad'
    }
  };
  const model = loadCondModel(projectWithMode, 'publicidad');
  const priceRows = model?.prices || {};
  const rolesInCondiciones = new Set(Object.keys(priceRows).map(r => {
    // Normalizar el nombre del rol (sin acentos, minúsculas, sin sufijos P/R)
    return String(r || '')
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }));

  // Debug: mostrar qué roles están en condiciones
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.PUBLICIDAD.aggregateReports] Roles en condiciones (originales):', Object.keys(priceRows));
    console.debug('[NOMINA.PUBLICIDAD.aggregateReports] Roles en condiciones (normalizados):', Array.from(rolesInCondiciones));
  }

  // Función para verificar si un rol está en condiciones
  const isRoleInCondiciones = (roleCode: string): boolean => {
    // Convertir código a nombre (ej: "BB" -> "Best boy")
    const roleName = ROLE_CODE_TO_LABEL[roleCode as keyof typeof ROLE_CODE_TO_LABEL] || roleCode;
    // Normalizar el nombre (sin acentos, minúsculas, sin sufijos P/R)
    const normalized = String(roleName || '')
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const isIn = rolesInCondiciones.has(normalized);
    
    // Debug: mostrar la verificación
    if ((import.meta as any).env.DEV) {
      console.debug(`[NOMINA.PUBLICIDAD.aggregateReports] isRoleInCondiciones: código="${roleCode}", nombre="${roleName}", normalizado="${normalized}", está en condiciones=${isIn}`);
    }
    
    return isIn;
  };

  const storageKeyFor = (roleCode: string, name: string, block?: string) => {
    const base = stripPR(roleCode || '');
    
    // En publicidad NO hay refuerzos, pero SÍ hay prelight y pickup
    if (block === 'pre') return `${base}.pre__${name || ''}`;
    if (block === 'pick') return `${base}.pick__${name || ''}`;
    
    // Usar la clave base sin sufijo P/R para coincidir con reportes
    return `${base}__${name || ''}`;
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
        horasExtra: 0,
        turnAround: 0,
        nocturnidad: 0,
        penaltyLunch: 0,
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

    // Usar la misma lógica que los reportes para generar la clave
    const weekKey = `reportes_${base}_${isoDays.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}
    
    // Debug: mostrar qué clave estamos buscando
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] Buscando clave:', weekKey);
      console.debug('[NOMINA.PUBLICIDAD] Datos encontrados:', data);
      console.debug('[NOMINA.PUBLICIDAD] Claves disponibles en datos:', Object.keys(data));
      console.debug('[NOMINA.PUBLICIDAD] isoDays:', isoDays);
      console.debug('[NOMINA.PUBLICIDAD] filteredDays:', filteredDays);
    }

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, string>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const vk = visibleRoleFor(r, n);
      
      // REF no se procesa en publicidad (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En publicidad no hay refuerzos
      }
      
      // NO filtrar aquí: permitir que todos los roles aparezcan
      // El filtrado de cantidades se hace en MonthSection basándose en si tienen precios válidos
      
      // Detectar bloque basándose en el sufijo del rol
      const block = r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
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
      
      // NO filtrar aquí: permitir que todos los roles aparezcan
      // El filtrado de cantidades se hace en MonthSection basándose en si tienen precios válidos
      
      // Debug: mostrar qué claves estamos buscando
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.PUBLICIDAD] Buscando persona:', pk, 'en datos:', data[pk]);
      }
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

        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === '1';
        const pen = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === '1';
        const transp = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === '1';

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he', he, 'ta', ta, 'noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
          
        // Debug específico para conceptos faltantes
        const km = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        const dVal = getCellValueCandidates(data, keysToUse, colCandidates.dietas, iso) || '';
        console.debug('[NOMINA.PUBLICIDAD] CONCEPTOS FALTANTES - km:', km, 'dietas:', dVal);
        
        // Debug adicional para ver qué datos tenemos disponibles
        console.debug('[NOMINA.PUBLICIDAD] DATA DEBUG - pk:', pk, 'keysToUse:', keysToUse, 'data keys:', Object.keys(data));
        if (data[pk]) {
          console.debug('[NOMINA.PUBLICIDAD] PERSON DATA - pk:', pk, 'person data keys:', Object.keys(data[pk]));
          if (data[pk]['Dietas']) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS DATA - pk:', pk, 'dietas data:', data[pk]['Dietas']);
          }
        }
        }

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, colCandidates.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        
        // Debug específico para dietas
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] DIETAS DEBUG - pk:', pk, 'iso:', iso, 'dVal:', dVal, 'labels:', labels, 'ticket:', ticket);
          
          // Debug adicional para ver qué está pasando con getCellValueCandidates
          console.debug('[NOMINA.PUBLICIDAD] DIETAS SEARCH DEBUG - pk:', pk, 'colCandidates.dietas:', colCandidates.dietas, 'data[pk]:', data[pk]);
          if (data[pk]) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS COLUMNS DEBUG - pk:', pk, 'available columns:', Object.keys(data[pk]));
            for (const col of colCandidates.dietas) {
              if (data[pk][col]) {
                console.debug('[NOMINA.PUBLICIDAD] DIETAS COLUMN DATA - pk:', pk, 'col:', col, 'data:', data[pk][col]);
                // Debug específico para ver qué fechas tienen datos
                const colData = data[pk][col];
                if (colData && typeof colData === 'object') {
                  const datesWithData = Object.keys(colData).filter(date => colData[date] && colData[date] !== '');
                  console.debug('[NOMINA.PUBLICIDAD] DIETAS DATES WITH DATA - pk:', pk, 'col:', col, 'dates:', datesWithData);
                  if (datesWithData.length > 0) {
                    console.debug('[NOMINA.PUBLICIDAD] DIETAS SAMPLE DATA - pk:', pk, 'col:', col, 'sample:', datesWithData.slice(0, 3).map(date => ({ date, value: colData[date] })));
                  }
                }
              }
            }
          }
        }
        
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
          
          // Debug específico para cada dieta
          if ((import.meta as any).env.DEV) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS COUNT - lab:', lab, 'prev:', prev, 'new:', prev + 1);
          }
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
  // Forzar el modo a publicidad para que loadCondModel cargue las condiciones correctas
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'publicidad'
    }
  };
  
  const m = loadCondModel(projectWithMode);
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

  // Obtener los roles que están definidos en condiciones
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'publicidad'
    }
  };
  const model = loadCondModel(projectWithMode, 'publicidad');
  const priceRows = model?.prices || {};
  const rolesInCondiciones = new Set(Object.keys(priceRows).map(r => {
    // Normalizar el nombre del rol (sin acentos, minúsculas, sin sufijos P/R)
    return String(r || '')
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }));

  // Función para verificar si un rol está en condiciones
  const isRoleInCondiciones = (roleCode: string): boolean => {
    // Convertir código a nombre (ej: "BB" -> "Best boy")
    const roleName = ROLE_CODE_TO_LABEL[roleCode as keyof typeof ROLE_CODE_TO_LABEL] || roleCode;
    // Normalizar el nombre (sin acentos, minúsculas, sin sufijos P/R)
    const normalized = String(roleName || '')
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    return rolesInCondiciones.has(normalized);
  };

  const storageKeyFor = (roleCode: string, name: string, block?: string) => {
    const base = stripPR(roleCode || '');
    
    // En publicidad NO hay refuerzos, pero SÍ hay prelight y pickup
    if (block === 'pre') return `${base}.pre__${name || ''}`;
    if (block === 'pick') return `${base}.pick__${name || ''}`;
    
    // Usar la clave base sin sufijo P/R para coincidir con reportes
    return `${base}__${name || ''}`;
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
        horasExtra: 0,
        turnAround: 0,
        nocturnidad: 0,
        penaltyLunch: 0,
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

    // Usar la misma lógica que los reportes para generar la clave
    const weekKey = `reportes_${base}_${isoDaysFull.join('_')}`;
    let data: any = {};
    try {
      const obj = storage.getJSON<any>(weekKey);
      if (obj) data = obj;
    } catch {}
    
    // Debug: mostrar qué clave estamos buscando
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD.WINDOWED] Buscando clave:', weekKey);
      console.debug('[NOMINA.PUBLICIDAD.WINDOWED] Datos encontrados:', data);
      console.debug('[NOMINA.PUBLICIDAD.WINDOWED] Claves disponibles en datos:', Object.keys(data));
      console.debug('[NOMINA.PUBLICIDAD.WINDOWED] isoDaysFull:', isoDaysFull);
      console.debug('[NOMINA.PUBLICIDAD.WINDOWED] isoDays:', isoDays);
    }

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, string>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const vk = visibleRoleFor(r, n);
      
      // REF no se procesa en publicidad (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En publicidad no hay refuerzos
      }
      
      // NO filtrar aquí: permitir que todos los roles aparezcan
      // El filtrado de cantidades se hace en MonthSection basándose en si tienen precios válidos
      
      // Detectar bloque basándose en el sufijo del rol
      const block = r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
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
      
      // Verificar nuevamente si el rol está en condiciones (por seguridad)
      // Extraer el rol base del visibleKey (puede tener sufijo P/R)
      const baseRoleFromVisible = stripPR(visibleKey);
      if (!isRoleInCondiciones(baseRoleFromVisible)) {
        if ((import.meta as any).env.DEV) {
          console.debug(`[NOMINA.PUBLICIDAD.aggregateWindowedReport] FILTRANDO en agregación: Rol "${baseRoleFromVisible}" (de visibleKey "${visibleKey}") no está en condiciones, saltando...`);
        }
        continue; // Saltar este rol completamente
      }
      
      const keysToUse = storageKeyVariants(pk);
      for (const iso of isoDays) {
        const slot = ensure(visibleKey);
        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, colCandidates.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, colCandidates.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === '1';
        const pen = getCellValueCandidates(data, keysToUse, colCandidates.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === '1';
        const transp = getCellValueCandidates(data, keysToUse, colCandidates.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === '1';

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he+ ta added noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
          
        // Debug específico para conceptos faltantes
        const km = parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        const dVal = getCellValueCandidates(data, keysToUse, colCandidates.dietas, iso) || '';
        console.debug('[NOMINA.PUBLICIDAD] CONCEPTOS FALTANTES - km:', km, 'dietas:', dVal);
        
        // Debug adicional para ver qué datos tenemos disponibles
        console.debug('[NOMINA.PUBLICIDAD] DATA DEBUG - pk:', pk, 'keysToUse:', keysToUse, 'data keys:', Object.keys(data));
        if (data[pk]) {
          console.debug('[NOMINA.PUBLICIDAD] PERSON DATA - pk:', pk, 'person data keys:', Object.keys(data[pk]));
          if (data[pk]['Dietas']) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS DATA - pk:', pk, 'dietas data:', data[pk]['Dietas']);
          }
        }
        }

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, colCandidates.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, colCandidates.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        
        // Debug específico para dietas
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] DIETAS DEBUG - pk:', pk, 'iso:', iso, 'dVal:', dVal, 'labels:', labels, 'ticket:', ticket);
          
          // Debug adicional para ver qué está pasando con getCellValueCandidates
          console.debug('[NOMINA.PUBLICIDAD] DIETAS SEARCH DEBUG - pk:', pk, 'colCandidates.dietas:', colCandidates.dietas, 'data[pk]:', data[pk]);
          if (data[pk]) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS COLUMNS DEBUG - pk:', pk, 'available columns:', Object.keys(data[pk]));
            for (const col of colCandidates.dietas) {
              if (data[pk][col]) {
                console.debug('[NOMINA.PUBLICIDAD] DIETAS COLUMN DATA - pk:', pk, 'col:', col, 'data:', data[pk][col]);
                // Debug específico para ver qué fechas tienen datos
                const colData = data[pk][col];
                if (colData && typeof colData === 'object') {
                  const datesWithData = Object.keys(colData).filter(date => colData[date] && colData[date] !== '');
                  console.debug('[NOMINA.PUBLICIDAD] DIETAS DATES WITH DATA - pk:', pk, 'col:', col, 'dates:', datesWithData);
                  if (datesWithData.length > 0) {
                    console.debug('[NOMINA.PUBLICIDAD] DIETAS SAMPLE DATA - pk:', pk, 'col:', col, 'sample:', datesWithData.slice(0, 3).map(date => ({ date, value: colData[date] })));
                  }
                }
              }
            }
          }
        }
        
        slot.ticketTotal += ticket;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
          
          // Debug específico para cada dieta
          if ((import.meta as any).env.DEV) {
            console.debug('[NOMINA.PUBLICIDAD] DIETAS COUNT - lab:', lab, 'prev:', prev, 'new:', prev + 1);
          }
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

    // 1) Búsqueda directa
    for (const col of columnCandidates) {
      const colData = personData[col];
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.PUBLICIDAD] Checking column:', col, 'data:', colData, 'iso:', iso, 'value:', colData?.[iso]);
      }
      if (colData && colData[iso] != null && colData[iso] !== '') {
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] Found direct match:', key, col, iso, '=', colData[iso]);
        }
        return String(colData[iso]);
      }
    }

    // 2) Búsqueda normalizada (case-insensitive, sin acentos) - COMO EN SEMANAL
    const toKey = new Map<string, string>();
    for (const k of Object.keys(personData)) {
      const low = String(k)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
      toKey.set(low, k);
    }
    for (const col of columnCandidates) {
      const low = String(col)
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
      const real = toKey.get(low);
      if (real) {
        const colData = personData[real];
        if (colData && colData[iso] != null && colData[iso] !== '') {
          if ((import.meta as any).env.DEV) {
            console.debug('[NOMINA.PUBLICIDAD] Found normalized match:', key, real, iso, '=', colData[iso]);
          }
          return String(colData[iso]);
        }
      }
    }
  }

  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.PUBLICIDAD] No match found for', columnCandidates, 'on', iso);
  }
  return undefined;
}
