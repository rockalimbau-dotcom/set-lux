import { storage } from '@shared/services/localStorage.service';
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
  dbgLog,
  COL_CANDIDATES,
  ROLE_ORDER,
} from './helpers';

/**
 * Ensure a slot exists in totals map
 */
function ensureSlot(
  totals: Map<string, any>,
  role: string,
  name: string,
  gender?: 'male' | 'female' | 'neutral'
) {
  const k = `${role}__${name}`;
  if (!totals.has(k)) {
    totals.set(k, {
      role,
      name,
      gender,
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
}

/**
 * Process a single day for a person
 */
function processDay(
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


  slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));

  // Para dietas, usar solo la clave original para evitar "comida" fantasma
  const dVal = getCellValueCandidates(data, [originalKey], COL_CANDIDATES.dietas, iso) || '';
  const { labels, ticket } = parseDietasValue(dVal);
  slot.ticketTotal += ticket;
  for (const lab of labels) {
    const prev = slot.dietasCount.get(lab) || 0;
    slot.dietasCount.set(lab, prev + 1);
  }
}

/**
 * Aggregate reports for multiple weeks
 */
export function aggregateReports(
  project: any,
  weeks: any[],
  filterISO: ((iso: string) => boolean) | null = null
) {
  const base = project?.id || project?.nombre || 'tmp';
  const totals = new Map<string, any>();
  const refuerzoSet = buildRefuerzoIndex(weeks);

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
      const slot = ensureSlot(totals, info.roleVisible, info.name, info.gender);
      for (const iso of days) {
        const keysToUse = getKeysToUse(pk, info.roleVisible);
        processDay(slot, data, keysToUse, pk, iso);
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

