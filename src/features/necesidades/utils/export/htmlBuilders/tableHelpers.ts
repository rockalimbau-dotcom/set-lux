import i18n from '../../../../../i18n/config';
import { DayValues } from '../types';
import {
  esc,
  formatDDMM,
  addDays,
  getDays,
  translateLocationValue,
} from '../helpers';

/**
 * Render cell content
 */
export function renderCell(text: any): string {
  return `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;
}

/**
 * Generate field row HTML
 */
export function fieldRow(
  key: string,
  label: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const rawValue = valuesByDay[i]?.[key] || '';
    // Only translate if it's the location field (key === 'loc')
    const displayValue = key === 'loc' ? translateLocationValue(rawValue) : rawValue;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${renderCell(displayValue)}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

/**
 * Generate list row HTML
 */
export function listRow(
  label: string,
  listKey: string,
  notesKey: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const list = Array.isArray(valuesByDay[i]?.[listKey]) ? valuesByDay[i][listKey] : [];
    const notes = valuesByDay[i]?.[notesKey] || '';
    const chips = list
      .map(m => {
        const role = (m?.role || '').toUpperCase();
        const name = m?.name || '';
        return `<div>• ${esc(role ? `${role}: ` : '')}${esc(name)}</div>`;
      })
      .join('');
    const block = `${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>` : ''}${renderCell(notes)}`;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

/**
 * Generate table body HTML
 */
export function generateTableBody(
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  return (
    fieldRow('loc', i18n.t('needs.location'), DAYS, valuesByDay) +
    fieldRow('seq', i18n.t('needs.sequences'), DAYS, valuesByDay) +
    listRow(i18n.t('needs.technicalTeam'), 'crewList', 'crewTxt', DAYS, valuesByDay) +
    fieldRow('needLoc', i18n.t('needs.locationNeeds'), DAYS, valuesByDay) +
    fieldRow('needProd', i18n.t('needs.productionNeeds'), DAYS, valuesByDay) +
    fieldRow('needLight', i18n.t('needs.lightNeeds'), DAYS, valuesByDay) +
    fieldRow('extraMat', i18n.t('needs.extraMaterial'), DAYS, valuesByDay) +
    fieldRow('precall', i18n.t('needs.precall'), DAYS, valuesByDay) +
    listRow(i18n.t('needs.prelightTeam'), 'preList', 'preTxt', DAYS, valuesByDay) +
    listRow(i18n.t('needs.pickupTeam'), 'pickList', 'pickTxt', DAYS, valuesByDay) +
    fieldRow('obs', i18n.t('needs.observations'), DAYS, valuesByDay)
  );
}

/**
 * Generate header row HTML
 */
export function generateHeaderRow(
  DAYS: ReturnType<typeof getDays>,
  monday: Date
): string {
  return DAYS.map(
    (_, i) =>
      `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
        ${esc(DAYS[i].name)}<br/>${esc(formatDDMM(addDays(monday, i)))}
      </th>`
  ).join('');
}

