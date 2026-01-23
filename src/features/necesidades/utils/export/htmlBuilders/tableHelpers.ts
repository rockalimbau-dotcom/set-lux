import i18n from '../../../../../i18n/config';
import { getRoleBadgeCode, applyGenderToBadge } from '@shared/constants/roles';
import { CustomRow, DayValues } from '../types';
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
function renderCell(text: any): string {
  return `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;
}

/**
 * Generate field row HTML
 */
function fieldRow(
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
function listRow(
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
        const isRefRole = role === 'REF' || (role && role.startsWith('REF') && role.length > 3);
        const suffix = !isRefRole && listKey === 'preList' ? 'P' : !isRefRole && listKey === 'pickList' ? 'R' : '';
        const baseBadge = getRoleBadgeCode(role, i18n.language);
        const badgeWithSuffix = isRefRole ? baseBadge : `${baseBadge}${suffix}`;
        const badgeDisplay = applyGenderToBadge(badgeWithSuffix, m?.gender);
        const name = m?.name || '';
        return `<div>• ${esc(badgeDisplay ? `${badgeDisplay}: ` : '')}${esc(name)}</div>`;
      })
      .join('');
    const block = `${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>` : ''}${renderCell(notes)}`;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

/**
 * Check if a field row is empty (all days have empty values)
 */
function isFieldRowEmpty(key: string, valuesByDay: DayValues[]): boolean {
  return valuesByDay.every(day => {
    const value = day[key];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
}

/**
 * Check if a list row is empty (all days have empty lists and notes)
 */
function isListRowEmpty(listKey: string, notesKey: string, valuesByDay: DayValues[]): boolean {
  return valuesByDay.every(day => {
    const list = Array.isArray(day[listKey]) ? day[listKey] : [];
    const notes = day[notesKey] || '';
    return list.length === 0 && (!notes || (typeof notes === 'string' && notes.trim() === ''));
  });
}

/**
 * Generate table body HTML
 */
export function generateTableBody(
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[],
  selectedRowKeys?: string[], // Filas seleccionadas para filtrar qué mostrar
  includeEmptyRows: boolean = false,
  customRows: CustomRow[] = []
): string {
  // Mapeo de fieldKey/listKey a función de generación
  const rowGenerators: Array<{ key: string; generate: () => string; isEmpty: () => boolean }> = [
    { key: 'loc', generate: () => fieldRow('loc', i18n.t('needs.location'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('loc', valuesByDay) },
    { key: 'seq', generate: () => fieldRow('seq', i18n.t('needs.sequences'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('seq', valuesByDay) },
    { key: 'crewList', generate: () => listRow(i18n.t('needs.technicalTeam'), 'crewList', 'crewTxt', DAYS, valuesByDay), isEmpty: () => isListRowEmpty('crewList', 'crewTxt', valuesByDay) },
    { key: 'needLoc', generate: () => fieldRow('needLoc', i18n.t('needs.locationNeeds'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needLoc', valuesByDay) },
    { key: 'needProd', generate: () => fieldRow('needProd', i18n.t('needs.productionNeeds'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needProd', valuesByDay) },
    { key: 'needTransport', generate: () => fieldRow('needTransport', i18n.t('needs.transportNeeds'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needTransport', valuesByDay) },
    { key: 'needGroups', generate: () => fieldRow('needGroups', i18n.t('needs.groupsNeeds'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needGroups', valuesByDay) },
    { key: 'needLight', generate: () => fieldRow('needLight', i18n.t('needs.lightNeeds'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needLight', valuesByDay) },
    { key: 'extraMat', generate: () => fieldRow('extraMat', i18n.t('needs.extraMaterial'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('extraMat', valuesByDay) },
    { key: 'precall', generate: () => fieldRow('precall', i18n.t('needs.precall'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('precall', valuesByDay) },
    { key: 'preList', generate: () => listRow(i18n.t('needs.prelightTeam'), 'preList', 'preTxt', DAYS, valuesByDay), isEmpty: () => isListRowEmpty('preList', 'preTxt', valuesByDay) },
    { key: 'pickList', generate: () => listRow(i18n.t('needs.pickupTeam'), 'pickList', 'pickTxt', DAYS, valuesByDay), isEmpty: () => isListRowEmpty('pickList', 'pickTxt', valuesByDay) },
    { key: 'obs', generate: () => fieldRow('obs', i18n.t('needs.observations'), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('obs', valuesByDay) },
  ];
  if (customRows.length > 0) {
    customRows.forEach(row => {
      if (!row?.fieldKey) return;
      const label = row.label || i18n.t('needs.customRowLabel');
      const hasLabel = Boolean((label || '').trim());
      rowGenerators.push({
        key: row.fieldKey,
        generate: () => fieldRow(row.fieldKey, label, DAYS, valuesByDay),
        isEmpty: () => !hasLabel && isFieldRowEmpty(row.fieldKey, valuesByDay),
      });
    });
  }
  
  // Si hay filas seleccionadas, filtrar
  if (selectedRowKeys && selectedRowKeys.length > 0) {
    // Extraer los fieldKeys de las claves seleccionadas (formato: weekId_fieldKey)
    const selectedFields = new Set(
      selectedRowKeys
        .map(key => {
          const customMarker = '_custom_';
          const customIdx = key.indexOf(customMarker);
          if (customIdx !== -1) {
            const customId = key.slice(customIdx + customMarker.length);
            const row = customRows.find(r => r.id === customId);
            return row?.fieldKey || null;
          }
          const parts = key.split('_');
          return parts.length > 1 ? parts[parts.length - 1] : null;
        })
        .filter(Boolean) as string[]
    );
    
    // Generar solo las filas seleccionadas (con o sin vacías)
    return rowGenerators
      .filter(row => selectedFields.has(row.key) && (includeEmptyRows || !row.isEmpty()))
      .map(row => row.generate())
      .join('');
  }
  
  // Si no hay selección, generar todas las filas (con o sin vacías)
  return rowGenerators
    .filter(row => includeEmptyRows || !row.isEmpty())
    .map(row => row.generate())
    .join('');
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

