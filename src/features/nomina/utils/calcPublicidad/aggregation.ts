import { storage } from '@shared/services/localStorage.service';
import { parseNum, parseDietasValue, parseHorasExtra } from '../parse';
import { buildRefuerzoIndex, weekISOdays, weekAllPeopleActive } from '../plan';
import { stripPR } from '../plan';
import { 
  getRolesInCondiciones, 
  isRoleInCondiciones, 
  visibleRoleFor, 
  COL_CANDIDATES, 
  ROLE_ORDER 
} from './aggregationHelpers';
import { storageKeyFor, storageKeyVariants, getCellValueCandidates } from './helpers';

/**
 * Aggregate reports for publicidad mode
 */
export function aggregateReports(project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null = null) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);
  const rolesInCondiciones = getRolesInCondiciones(project);

  // Debug: mostrar qué roles están en condiciones
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.PUBLICIDAD.aggregateReports] Roles en condiciones (normalizados):', Array.from(rolesInCondiciones));
  }

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
      const vk = visibleRoleFor(r, n, refuerzoSet);
      
      // REF no se procesa en publicidad (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En publicidad no hay refuerzos
      }
      
      // Detectar bloque basándose en el sufijo del rol
      const block = r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
    }

    // Debug: log week data
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] Semana', weekKey + ':', data);
      console.debug('[NOMINA.PUBLICIDAD] Claves disponibles:', Object.keys(data));
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

        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === '1';
        const pen = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === '1';
        const transp = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === '1';

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he', he, 'ta', ta, 'noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
        }

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        
        // Debug específico para dietas
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] DIETAS DEBUG - pk:', pk, 'iso:', iso, 'dVal:', dVal, 'labels:', labels, 'ticket:', ticket);
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

  return Array.from(totals.values()).sort(
    (a, b) =>
      (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99) ||
      a.name.localeCompare(b.name, 'es')
  );
}

/**
 * Aggregate windowed report for publicidad mode
 */
export function aggregateWindowedReport(project: any, weeks: any[], filterISO: (iso: string) => boolean) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);
  const rolesInCondiciones = getRolesInCondiciones(project);

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
      const vk = visibleRoleFor(r, n, refuerzoSet);
      
      // REF no se procesa en publicidad (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En publicidad no hay refuerzos
      }
      
      // Detectar bloque basándose en el sufijo del rol
      const block = r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
    }

    for (const [storageKey, visibleKey] of uniqStorage) {
      const pk = storageKey;
      
      // Verificar nuevamente si el rol está en condiciones (por seguridad)
      // Extraer el rol base del visibleKey (puede tener sufijo P/R)
      const baseRoleFromVisible = stripPR(visibleKey);
      if (!isRoleInCondiciones(baseRoleFromVisible, rolesInCondiciones)) {
        if ((import.meta as any).env.DEV) {
          console.debug(`[NOMINA.PUBLICIDAD.aggregateWindowedReport] FILTRANDO en agregación: Rol "${baseRoleFromVisible}" (de visibleKey "${visibleKey}") no está en condiciones, saltando...`);
        }
        continue; // Saltar este rol completamente
      }
      
      const keysToUse = storageKeyVariants(pk);
      for (const iso of isoDays) {
        const slot = ensure(visibleKey);
        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
        const noctYes = noct === 'SI' || noct === 'SÍ' || noct === 'S' || noct === '1' || noct === '1';
        const pen = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
        const penYes = pen === 'SI' || pen === 'SÍ' || pen === 'S' || pen === '1' || pen === '1';
        const transp = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
        const transpYes = transp === 'SI' || transp === 'SÍ' || transp === 'S' || transp === '1' || transp === '1';

        // Debug: log values found
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] iso', iso, 'he+ ta added noct', noct, 'noctYes', noctYes, 'pen', pen, 'penYes', penYes, 'transp', transp, 'transpYes', transpYes);
        }

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.dietas, iso) || '';
        const { labels, ticket } = parseDietasValue(dVal);
        
        // Debug específico para dietas
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] DIETAS DEBUG - pk:', pk, 'iso:', iso, 'dVal:', dVal, 'labels:', labels, 'ticket:', ticket);
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

