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
import { storageKeyFor, storageKeyVariants, getCellValueCandidates, valIsYes } from './helpers';

/**
 * Aggregate reports for diario mode
 */
export function aggregateReports(project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null = null) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);
  const rolesInCondiciones = getRolesInCondiciones(project);


  const ensure = (
    rowKey: string,
    role: string,
    name: string,
    gender?: 'male' | 'female' | 'neutral',
    source?: string,
    matchRole?: string,
    displayBlock?: 'base' | 'pre' | 'pick'
  ) => {
    const k = rowKey;
    if (!totals.has(k)) {
      totals.set(k, {
        _rowKey: rowKey,
        _matchRole: matchRole || role,
        _displayBlock: displayBlock || 'base',
        role,
        name,
        gender,
        source,
        extras: 0,
        horasExtra: 0,
        turnAround: 0,
        nocturnidad: 0,
        penaltyLunch: 0,
        transporte: 0,
        km: 0,
        materialPropioDays: 0,
        materialPropioWeeks: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
        otherTotal: 0,
      });
    }
    if (source && !totals.get(k).source) totals.get(k).source = source;
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
    

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, { roleVisible: string; gender?: 'male' | 'female' | 'neutral'; source?: string; rowKey: string; matchRole: string; displayBlock: 'base' | 'pre' | 'pick' }>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const vk = visibleRoleFor(r, n, refuerzoSet, (p as any)?.source);
      const gender = (p as any)?.gender;
      const source = (p as any)?.source;
      
      // REF no se procesa en diario (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En diario no hay refuerzos
      }
      
      // Detectar bloque basándose en el sufijo del rol
      const block = source === 'pre' ? 'pre' : source === 'pick' ? 'pick' : r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      const displayBlock = block === 'pre' ? 'pre' : block === 'pick' ? 'pick' : 'base';
      const rowKey =
        displayBlock === 'pre'
          ? `${vk}.pre__${n}`
          : displayBlock === 'pick'
          ? `${vk}.pick__${n}`
          : `${vk}__${n}`;
      const matchRole =
        displayBlock === 'pre' ? `${stripPR(r)}P` : displayBlock === 'pick' ? `${stripPR(r)}R` : stripPR(r);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, { roleVisible: vk, gender, source, rowKey, matchRole, displayBlock });
    }


    for (const [storageKey, meta] of uniqStorage) {
      const pk = storageKey;
      const roleVis = meta.roleVisible;
      const personName = pk.split('__')[1] || '';
      let usedMaterialPropioWeek = false;

      for (const iso of filteredDays) {
        const keysToUse = storageKeyVariants(pk);
        const slot = ensure(meta.rowKey, roleVis, personName, meta.gender, meta.source, meta.matchRole, meta.displayBlock);

        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
        const noctYes = valIsYes(noct);
        const pen = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
        const penYes = valIsYes(pen);
        const transp = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
        const transpYes = valIsYes(transp);
        const mpVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.materialPropio, iso);
        const mpYes = valIsYes(mpVal);

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;
        if (mpYes) {
          slot.materialPropioDays += 1;
          usedMaterialPropioWeek = true;
        }

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.dietas, iso) || '';
        const { labels, ticket, other } = parseDietasValue(dVal);
        
        slot.ticketTotal += ticket;
        slot.otherTotal += other;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
      if (usedMaterialPropioWeek) {
        const slot = ensure(meta.rowKey, roleVis, personName, meta.gender, meta.source, meta.matchRole, meta.displayBlock);
        slot.materialPropioWeeks += 1;
      }
    }
  }

  return Array.from(totals.values()).sort(
    (a, b) => {
      // Si el rol empieza con REF (REFG, REFBB, etc.), usar orden 7 (igual que REF)
      const roleA = a.role && a.role.startsWith('REF') && a.role.length > 3 ? 'REF' : a.role;
      const roleB = b.role && b.role.startsWith('REF') && b.role.length > 3 ? 'REF' : b.role;
      return (ROLE_ORDER[roleA] ?? 99) - (ROLE_ORDER[roleB] ?? 99) ||
        a.name.localeCompare(b.name, 'es');
    }
  );
}

/**
 * Aggregate windowed report for diario mode
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
        materialPropioDays: 0,
        materialPropioWeeks: 0,
        dietasCount: new Map<string, number>(),
        ticketTotal: 0,
        otherTotal: 0,
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
    

    const rawPeople = weekAllPeopleActive(w);
    const uniqStorage = new Map<string, string>();
    for (const p of rawPeople) {
      const r = p.role || '';
      const n = p.name || '';
      const vk = visibleRoleFor(r, n, refuerzoSet, (p as any)?.source);
      
      // REF no se procesa en diario (no hay refuerzos)
      if (vk === 'REF') {
        continue; // En diario no hay refuerzos
      }
      
      // Detectar bloque basándose en el sufijo del rol
      const block = r.endsWith('P') ? 'pre' : r.endsWith('R') ? 'pick' : undefined;
      const sk = storageKeyFor(r, n, block);
      if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
    }

    for (const [storageKey, visibleKey] of uniqStorage) {
      const pk = storageKey;
      let usedMaterialPropioWeek = false;
      
      // Verificar nuevamente si el rol está en condiciones (por seguridad)
      // Extraer el rol base del visibleKey (puede tener sufijo P/R)
      const baseRoleFromVisible = stripPR(visibleKey);
      if (!isRoleInCondiciones(baseRoleFromVisible, rolesInCondiciones)) {
        continue; // Saltar este rol completamente
      }
      
      const keysToUse = storageKeyVariants(pk);
      for (const iso of isoDays) {
        const slot = ensure(visibleKey);
        const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
        const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
        const noct = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
        const noctYes = valIsYes(noct);
        const pen = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
        const penYes = valIsYes(pen);
        const transp = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
        const transpYes = valIsYes(transp);
        const mpVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.materialPropio, iso);
        const mpYes = valIsYes(mpVal);

        slot.horasExtra += he;
        slot.turnAround += ta;
        slot.nocturnidad += noctYes ? 1 : 0;
        slot.penaltyLunch += penYes ? 1 : 0;
        slot.extras += he + ta + (noctYes ? 1 : 0) + (penYes ? 1 : 0); // Keep total for backward compatibility
        slot.transporte += transpYes ? 1 : 0;
        if (mpYes) {
          slot.materialPropioDays += 1;
          usedMaterialPropioWeek = true;
        }

        slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));
        
        // Para dietas, usar las mismas claves que las otras columnas
        const dVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.dietas, iso) || '';
        const { labels, ticket, other } = parseDietasValue(dVal);
        
        slot.ticketTotal += ticket;
        slot.otherTotal += other;
        for (const lab of labels) {
          const prev = slot.dietasCount.get(lab) || 0;
          slot.dietasCount.set(lab, prev + 1);
        }
      }
      if (usedMaterialPropioWeek) {
        const slot = ensure(visibleKey);
        slot.materialPropioWeeks += 1;
      }
    }
  }

  return totals;
}
