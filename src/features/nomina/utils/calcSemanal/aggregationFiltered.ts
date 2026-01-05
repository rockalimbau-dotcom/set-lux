import { storage } from '@shared/services/localStorage.service';
import { parseYYYYMMDD } from '@shared/utils/date';
import { parseNum, parseDietasValue, parseHorasExtra } from '../parse';
import { weekISOdays } from '../plan';
import { buildRefuerzoIndex } from '../plan';
import {
  storageKeyFor,
  visibleRoleFor,
  buildUniqueStorageKeys,
  getKeysToUse,
} from './aggregationHelpers';
import {
  getCellValueCandidates,
  valIsYes,
  COL_CANDIDATES,
} from './helpers';

/**
 * Ensure a slot exists in totals map
 */
function ensureSlot(
  totals: Map<string, any>,
  role: string,
  name: string
) {
  const k = `${role}__${name}`;
  if (!totals.has(k)) {
    totals.set(k, {
      role,
      name,
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
}

/**
 * Process a single day for a person (filtered version, no extras field)
 */
function processDayFiltered(
  slot: any,
  data: any,
  keysToUse: string[],
  originalKey: string,
  iso: string
) {
  const he = parseHorasExtra(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.extras, iso));
  const ta = parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.ta, iso));
  slot.horasExtra += he;
  slot.turnAround += ta;

  const nVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.noct, iso);
  const nYes = valIsYes(nVal);
  if (nYes) {
    slot.nocturnidad += 1;
  }

  const pVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.penalty, iso);
  const pYes = valIsYes(pVal);
  if (pYes) {
    slot.penaltyLunch += 1;
  }

  const tVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.transp, iso);
  const tYes = valIsYes(tVal);
  if (tYes) slot.transporte += 1;

  slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));

  const dVal = getCellValueCandidates(data, [originalKey], COL_CANDIDATES.dietas, iso) || '';
  const { labels, ticket } = parseDietasValue(dVal);
  slot.ticketTotal += ticket;
  for (const lab of labels) {
    const prev = slot.dietasCount.get(lab) || 0;
    slot.dietasCount.set(lab, prev + 1);
  }
}

/**
 * Aggregate filtered concepts by date range
 */
export function aggregateFilteredConcepts(
  project: any,
  weeks: any[],
  filterISO: ((iso: string) => boolean) | null,
  dateFrom: string | null,
  dateTo: string | null
) {
  if (!dateFrom || !dateTo) {
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.FILTER] No dates provided, returning null');
    }
    return null;
  }

  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.FILTER] Starting aggregateFilteredConcepts with dates:', dateFrom, 'to', dateTo);
  }

  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

  // Convertir fechas a objetos Date para comparación
  const fromDate = dateFrom ? parseYYYYMMDD(dateFrom) : null;
  const toDate = dateTo ? parseYYYYMMDD(dateTo) : null;
  if (!fromDate || !toDate) return null;

  // Función para verificar si una fecha ISO está en el rango
  const isInDateRange = (iso: string): boolean => {
    const date = parseYYYYMMDD(iso);
    if (!date) return false;
    const inRange = date >= fromDate && date <= toDate;
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.FILTER] Checking date:', iso, 'from:', dateFrom, 'to:', dateTo, 'inRange:', inRange);
    }
    return inRange;
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

    const uniqStorageKeys = buildUniqueStorageKeys(w, refuerzoSet);

    for (const [pk, info] of uniqStorageKeys) {
      const slot = ensureSlot(totals, info.roleVisible, info.name);
      for (const iso of days) {
        // Solo procesar días dentro del rango de fechas
        if (!isInDateRange(iso)) continue;

        const keysToUse = getKeysToUse(pk, info.roleVisible);
        processDayFiltered(slot, data, keysToUse, pk, iso);
      }
    }
  }

  return totals;
}

