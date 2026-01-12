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
  valuesByDay: DayValues[],
  selectedRowKeys?: string[] // Filas seleccionadas para filtrar qué mostrar
): string {
  // Mapeo de fieldKey/listKey a función de generación
  const rowGenerators: Array<{ key: string; generate: () => string }> = [
    { key: 'loc', generate: () => fieldRow('loc', i18n.t('needs.location'), DAYS, valuesByDay) },
    { key: 'seq', generate: () => fieldRow('seq', i18n.t('needs.sequences'), DAYS, valuesByDay) },
    { key: 'crewList', generate: () => listRow(i18n.t('needs.technicalTeam'), 'crewList', 'crewTxt', DAYS, valuesByDay) },
    { key: 'needLoc', generate: () => fieldRow('needLoc', i18n.t('needs.locationNeeds'), DAYS, valuesByDay) },
    { key: 'needProd', generate: () => fieldRow('needProd', i18n.t('needs.productionNeeds'), DAYS, valuesByDay) },
    { key: 'needLight', generate: () => fieldRow('needLight', i18n.t('needs.lightNeeds'), DAYS, valuesByDay) },
    { key: 'extraMat', generate: () => fieldRow('extraMat', i18n.t('needs.extraMaterial'), DAYS, valuesByDay) },
    { key: 'precall', generate: () => fieldRow('precall', i18n.t('needs.precall'), DAYS, valuesByDay) },
    { key: 'preList', generate: () => listRow(i18n.t('needs.prelightTeam'), 'preList', 'preTxt', DAYS, valuesByDay) },
    { key: 'pickList', generate: () => listRow(i18n.t('needs.pickupTeam'), 'pickList', 'pickTxt', DAYS, valuesByDay) },
    { key: 'obs', generate: () => fieldRow('obs', i18n.t('needs.observations'), DAYS, valuesByDay) },
  ];
  
  // Si hay filas seleccionadas, filtrar
  if (selectedRowKeys && selectedRowKeys.length > 0) {
    // Extraer los fieldKeys de las claves seleccionadas (formato: weekId_fieldKey)
    const selectedFields = new Set(
      selectedRowKeys
        .map(key => {
          const parts = key.split('_');
          return parts.length > 1 ? parts[parts.length - 1] : null;
        })
        .filter(Boolean) as string[]
    );
    
    // Generar solo las filas seleccionadas
    return rowGenerators
      .filter(row => selectedFields.has(row.key))
      .map(row => row.generate())
      .join('');
  }
  
  // Si no hay selección, generar todas las filas
  return rowGenerators.map(row => row.generate()).join('');
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

