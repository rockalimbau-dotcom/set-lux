import { storage } from '@shared/services/localStorage.service';
import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';
import { parseNum, parseDietasValue, parseHorasExtra } from '../parse';
import { weekISOdays, stripPR } from '../plan';
import { buildRefuerzoIndex } from '../plan';
import {
  buildUniqueStorageKeys,
  getKeysToUse,
} from './aggregationHelpers';
import {
  getCellValueCandidates,
  valIsYes,
  COL_CANDIDATES,
} from './helpers';

/**
 * Ensure a slot exists in totals map (windowed version uses visibleKey only)
 */
function ensureSlotWindowed(
  totals: Map<string, any>,
  rowKey: string
) {
  if (!totals.has(rowKey)) {
    totals.set(rowKey, {
      _rowKey: rowKey,
      extras: 0,
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
  return totals.get(rowKey);
}

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

function isScheduledForRowOnDay(day: any, info: any, storageKey: string): boolean {
  const list = membersForBlock(day, info.displayBlock, storageKey);
  if (!Array.isArray(list) || list.length === 0) return false;
  return list.some(member => memberMatchesInfo(member, info));
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
  slot.gasolina += parseNum(getCellValueCandidates(data, keysToUse, COL_CANDIDATES.gasolina, iso));

  const dietasKeys = Array.from(new Set([storageKey, ...keysToUse]));
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

    const uniqStorageKeys = buildUniqueStorageKeys(w, refuerzoSet);
    const sortedEntries = Array.from(uniqStorageKeys.entries()).sort((a, b) => {
      const priority = { extra: 0, pre: 1, pick: 2, base: 3 } as const;
      return (priority[a[1].displayBlock] ?? 9) - (priority[b[1].displayBlock] ?? 9);
    });
    const processedByPersonAndDay = new Set<string>();

    for (const [storageKey, info] of sortedEntries) {
      const slot = ensureSlotWindowed(totals, info.rowKey);
      let usedMaterialPropioWeek = false;
      for (const iso of isoDays) {
        const dayIdx = isoDaysFull.indexOf(iso);
        const day = dayIdx >= 0 ? w?.days?.[dayIdx] : null;
        if (!isScheduledForRowOnDay(day, info, storageKey)) continue;
        const nameRoleToken = `${normText(info?.name)}__${normText(stripPR(String(info?.matchRole || info?.roleVisible || '')))}`;
        const personIdToken = String(info?.personId || '').trim();
        const personDayTokens = [
          `${nameRoleToken}::${iso}`,
          ...(personIdToken ? [`pid:${personIdToken}::${iso}`] : []),
        ];
        if (personDayTokens.some(token => processedByPersonAndDay.has(token))) continue;

        const keysToUse = getKeysToUse(storageKey, info.roleVisible);
        const { materialPropioUsed } = processDayWindowed(slot, data, keysToUse, storageKey, iso);
        if (materialPropioUsed) usedMaterialPropioWeek = true;
        personDayTokens.forEach(token => processedByPersonAndDay.add(token));
      }
      if (usedMaterialPropioWeek) slot.materialPropioWeeks += 1;
    }
  }

  return totals;
}
