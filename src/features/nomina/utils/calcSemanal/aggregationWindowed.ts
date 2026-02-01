import { storage } from '@shared/services/localStorage.service';
import { parseNum, parseDietasValue, parseHorasExtra } from '../parse';
import { weekISOdays, weekAllPeopleActive } from '../plan';
import { buildRefuerzoIndex } from '../plan';
import {
  storageKeyFor,
  visibleRoleFor,
} from './aggregationHelpers';
import {
  getCellValueCandidates,
  valIsYes,
  dbgLog,
  storageKeyVariants,
  COL_CANDIDATES,
} from './helpers';

/**
 * Ensure a slot exists in totals map (windowed version uses visibleKey only)
 */
function ensureSlotWindowed(
  totals: Map<string, any>,
  visibleKey: string
) {
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
}

/**
 * Process a single day for a person (windowed version)
 */
function processDayWindowed(
  slot: any,
  data: any,
  keysToUse: string[],
  storageKey: string,
  iso: string
): { materialPropioUsed: boolean } {
  const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
  const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
  slot.horasExtra += he;
  slot.turnAround += ta;
  slot.extras += he + ta; // Keep total for backward compatibility

  const nVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
  const nYes = valIsYes(nVal);
  if (nYes) {
    slot.nocturnidad += 1;
    slot.extras += 1; // Keep total for backward compatibility
  }

  const pVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
  const pYes = valIsYes(pVal);
  if (pYes) {
    slot.penaltyLunch += 1;
    slot.extras += 1; // Keep total for backward compatibility
  }

  const tVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
  const tYes = valIsYes(tVal);
  if (tYes) slot.transporte += 1;

  const mpVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.materialPropio, iso);
  const mpYes = valIsYes(mpVal);
  if (mpYes) slot.materialPropioDays += 1;

  slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));

  // Para dietas, usar solo la clave original para evitar "comida" fantasma
  const dVal = getCellValueCandidates(data, [storageKey], COL_CANDIDATES.dietas, iso) || '';
  const { labels, ticket, other } = parseDietasValue(dVal);
  slot.ticketTotal += ticket;
  slot.otherTotal += other;
  for (const lab of labels) {
    const prev = slot.dietasCount.get(lab) || 0;
    slot.dietasCount.set(lab, prev + 1);
  }
  return { materialPropioUsed: mpYes };
}

/**
 * Aggregate windowed report
 */
export function aggregateWindowedReport(
  project: any,
  weeks: any[],
  filterISO: (iso: string) => boolean
) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

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
      const vk = visibleRoleFor(r, n, refuerzoSet);
      if (vk === 'REF') {
        // Claves posibles en Reportes por bloque
        for (const sk of [`REF__${n}`, `REF.pre__${n}`, `REF.pick__${n}`]) {
          if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
        }
      } else {
        const sk = storageKeyFor(r, n, refuerzoSet);
        if (!uniqStorage.has(sk)) uniqStorage.set(sk, vk);
      }
    }

    for (const [storageKey, visibleKey] of uniqStorage) {
      const slot = ensureSlotWindowed(totals, visibleKey);
      let usedMaterialPropioWeek = false;
      for (const iso of isoDays) {
        // Variantes para todos los NO-REF; REF solo su clave original
        const keysToUse = visibleKey === 'REF' ? [storageKey] : storageKeyVariants(storageKey);
        const { materialPropioUsed } = processDayWindowed(slot, data, keysToUse, storageKey, iso);
        if (materialPropioUsed) usedMaterialPropioWeek = true;
      }
      if (usedMaterialPropioWeek) slot.materialPropioWeeks += 1;
    }
  }

  return totals;
}

