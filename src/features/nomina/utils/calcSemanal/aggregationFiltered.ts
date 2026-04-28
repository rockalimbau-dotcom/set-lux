import { storage } from '@shared/services/localStorage.service';
import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';
import { parseYYYYMMDD } from '@shared/utils/date';
import { parseNum, parseDietasValue, parseHorasExtra } from '../parse';
import { weekISOdays, stripPR } from '../plan';
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

const normText = (value: unknown): string =>
  String(value || '')
    .trim()
    .toLowerCase();

function membersForBlock(day: any, displayBlock: 'base' | 'pre' | 'pick' | 'extra', storageKey: string): any[] {
  if (!day) return [];
  if (displayBlock === 'base') return Array.isArray(day?.team) ? day.team : [];
  if (displayBlock === 'pre') return Array.isArray(day?.prelight) ? day.prelight : [];
  if (displayBlock === 'pick') return Array.isArray(day?.pickup) ? day.pickup : [];

  const indexedExtraMatch = String(storageKey || '').match(/\.extra:(\d+)__/);
  if (indexedExtraMatch) {
    const idx = Number(indexedExtraMatch[1]);
    if (Number.isFinite(idx) && idx >= 0) {
      const block = normalizeExtraBlocks(day)[idx];
      return Array.isArray(block?.list) ? block.list : [];
    }
  }
  return Array.isArray(day?.refList) ? day.refList : [];
}

function memberMatchesInfo(member: any, info: any): boolean {
  const wantedPersonId = String(info?.personId || '').trim();
  const wantedRoleId = String(info?.roleId || '').trim();
  const wantedName = normText(info?.name);
  const wantedBaseRole = normText(stripPR(String(info?.matchRole || info?.roleVisible || '')));

  const memberPersonId = String(member?.personId || '').trim();
  if (wantedPersonId && memberPersonId && memberPersonId !== wantedPersonId) return false;

  const memberRoleId = String(member?.roleId || '').trim();
  if (wantedRoleId && memberRoleId && memberRoleId !== wantedRoleId) return false;

  if (wantedName && normText(member?.name) !== wantedName) return false;

  if (wantedBaseRole) {
    const memberBaseRole = normText(stripPR(String(member?.role || '')));
    if (memberBaseRole && memberBaseRole !== wantedBaseRole) return false;
  }

  return true;
}

function appearsInNonBaseBlocks(day: any, info: any): boolean {
  if (!day) return false;
  const pre = Array.isArray(day?.prelight) ? day.prelight : [];
  const pick = Array.isArray(day?.pickup) ? day.pickup : [];
  const extraLegacy = Array.isArray(day?.refList) ? day.refList : [];
  const extraIndexed = normalizeExtraBlocks(day).flatMap(block => (Array.isArray(block?.list) ? block.list : []));
  const merged = [...pre, ...pick, ...extraLegacy, ...extraIndexed];
  return merged.some(member => memberMatchesInfo(member, info));
}

function isScheduledForRowOnDay(day: any, info: any, storageKey: string): boolean {
  if (!day) return true;
  const list = membersForBlock(day, info.displayBlock, storageKey);
  if (!Array.isArray(list) || list.length === 0) return true;
  const matchedInOwnBlock = list.some(member => memberMatchesInfo(member, info));
  if (!matchedInOwnBlock) return false;
  if (info?.displayBlock === 'base' && appearsInNonBaseBlocks(day, info)) return false;
  return true;
}

/**
 * Ensure a slot exists in totals map
 */
function ensureSlot(
  totals: Map<string, any>,
  rowKey: string,
  role: string,
  name: string
) {
  const k = rowKey;
  if (!totals.has(k)) {
    totals.set(k, {
      _rowKey: rowKey,
      role,
      name,
      horasExtra: 0,
      turnAround: 0,
      nocturnidad: 0,
      penaltyLunch: 0,
      transporte: 0,
      km: 0,
      gasolina: 0,
      materialPropioDays: 0,
      materialPropioWeeks: 0,
      dietasCount: new Map<string, number>(),
      ticketTotal: 0,
      otherTotal: 0,
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
): { materialPropioUsed: boolean } {
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

  const mpVal = getCellValueCandidates(data, keysToUse, COL_CANDIDATES.materialPropio, iso);
  const mpYes = valIsYes(mpVal);
  if (mpYes) slot.materialPropioDays += 1;

  slot.km += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.km, iso));
  slot.gasolina += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.gasolina, iso));

  const dietasKeys = Array.from(new Set([originalKey, ...keysToUse]));
  const dVal = getCellValueCandidates(data, dietasKeys, COL_CANDIDATES.dietas, iso) || '';
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
    return null;
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
    return date >= fromDate && date <= toDate;
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
    const sortedEntries = Array.from(uniqStorageKeys.entries()).sort((a, b) => {
      const priority = { extra: 0, pre: 1, pick: 2, base: 3 } as const;
      return (priority[a[1].displayBlock] ?? 9) - (priority[b[1].displayBlock] ?? 9);
    });
    const processedByPersonAndDay = new Set<string>();

    for (const [pk, info] of sortedEntries) {
      const slot = ensureSlot(totals, info.rowKey, info.roleVisible, info.name);
      let usedMaterialPropioWeek = false;
      for (const iso of days) {
        // Solo procesar días dentro del rango de fechas
        if (!isInDateRange(iso)) continue;
        const dayIdx = isoDays.indexOf(iso);
        const day = dayIdx >= 0 ? w?.days?.[dayIdx] : null;
        if (!isScheduledForRowOnDay(day, info, pk)) continue;
        const nameRoleToken = `${normText(info?.name)}__${normText(stripPR(String(info?.matchRole || info?.roleVisible || '')))}`;
        const personIdToken = String(info?.personId || '').trim();
        const personDayTokens = [
          `${nameRoleToken}::${iso}`,
          ...(personIdToken ? [`pid:${personIdToken}::${iso}`] : []),
        ];
        if (personDayTokens.some(token => processedByPersonAndDay.has(token))) continue;

        const keysToUse = getKeysToUse(pk, info.roleVisible);
        const { materialPropioUsed } = processDayFiltered(slot, data, keysToUse, pk, iso);
        if (materialPropioUsed) usedMaterialPropioWeek = true;
        personDayTokens.forEach(token => processedByPersonAndDay.add(token));
      }
      if (usedMaterialPropioWeek) slot.materialPropioWeeks += 1;
    }
  }

  return totals;
}
