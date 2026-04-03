import i18n from '../../../../../i18n/config';
import { getRoleBadgeCode, applyGenderToBadge } from '@shared/constants/roles';
import { normalizeJornadaType, translateJornadaType } from '@shared/utils/jornadaTranslations';
import { CustomRow, DayValues, RowLabelOverrides } from '../types';
import {
  esc,
  formatDDMM,
  addDays,
  getDays,
  translateLocationValue,
} from '../helpers';
import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';

/**
 * Render cell content
 */
function renderCell(text: any): string {
  return `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;
}

function formatMemberDisplay(
  member: { role?: string; roleLabel?: string; gender?: 'male' | 'female' | 'neutral' },
  suffix = ''
): string {
  const role = (member?.role || '').toUpperCase();
  const roleLabel = String(member?.roleLabel || '').trim();
  const isCustomLabel = roleLabel !== '' && roleLabel.toUpperCase() !== role;
  if (isCustomLabel) {
    return `${roleLabel}${suffix}`.trim();
  }
  const badge = getRoleBadgeCode(role, i18n.language);
  return applyGenderToBadge(`${badge}${suffix}`, member?.gender);
}

function translateScheduleType(tipo: string): string {
  return translateJornadaType(tipo, (key: string, defaultValue?: string) => {
    const translated = i18n.t(key);
    return translated === key && defaultValue ? defaultValue : translated;
  });
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
    const displayValue = key === 'loc' ? translateLocationValue(rawValue) : rawValue;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${renderCell(displayValue)}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

function mergedLocSeqRow(
  label: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const loc = translateLocationValue(valuesByDay[i]?.loc || '');
    const seq = valuesByDay[i]?.seq || '';
    const combined = seq ? [loc, seq].filter(Boolean).join('\n') : loc;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${renderCell(combined)}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

function simpleRow(
  label: string,
  DAYS: ReturnType<typeof getDays>,
  values: string[]
): string {
  const tds = DAYS.map((_, i) => {
    const displayValue = values[i] || '';
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
        const badgeDisplay = formatMemberDisplay(m, isRefRole ? '' : suffix);
        const name = m?.name || '';
        return `<div>• ${esc(badgeDisplay ? `${badgeDisplay}: ` : '')}${esc(name)}</div>`;
      })
      .join('');
    const block = `${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>` : ''}${renderCell(notes)}`;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

function listRowWithSchedule(
  label: string,
  listKey: string,
  notesKey: string,
  tipoKey: string,
  startKey: string,
  endKey: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const list = Array.isArray(valuesByDay[i]?.[listKey]) ? valuesByDay[i][listKey] : [];
    const notes = valuesByDay[i]?.[notesKey] || '';
    const tipo = translateScheduleType(valuesByDay[i]?.[tipoKey] || '');
    const start = valuesByDay[i]?.[startKey] || '';
    const end = valuesByDay[i]?.[endKey] || '';
    const scheduleLine = [tipo, start || end ? `${start}${start && end ? ' - ' : ''}${end}` : '']
      .filter(Boolean)
      .join(' | ');
    const chips = list
      .map(m => {
        const role = (m?.role || '').toUpperCase();
        const isRefRole = role === 'REF' || (role && role.startsWith('REF') && role.length > 3);
        const suffix = !isRefRole && listKey === 'preList' ? 'P' : !isRefRole && listKey === 'pickList' ? 'R' : '';
        const badgeDisplay = formatMemberDisplay(m, isRefRole ? '' : suffix);
        const name = m?.name || '';
        return `<div>• ${esc(badgeDisplay ? `${badgeDisplay}: ` : '')}${esc(name)}</div>`;
      })
      .join('');
    const header = scheduleLine ? `<div style="margin-bottom:6px;font-weight:600;">${esc(scheduleLine)}</div>` : '';
    const block = `${header}${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>` : ''}${renderCell(notes)}`;
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

function extraBlocksRow(
  label: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const blocks = normalizeExtraBlocks(valuesByDay[i] || {});
    const content = blocks
      .map(block => {
        const scheduleLine = [translateScheduleType(block.tipo || ''), block.start || block.end ? `${block.start}${block.start && block.end ? ' - ' : ''}${block.end}` : '']
          .filter(Boolean)
          .join(' | ');
        const header = scheduleLine
          ? `<div style="margin-bottom:6px;font-weight:600;">${esc(scheduleLine)}</div>`
          : '';
        const chips = (block.list || [])
          .map(m => {
            const role = (m?.role || '').toUpperCase();
            const isRefRole = role === 'REF' || (role && role.startsWith('REF') && role.length > 3);
            const badgeDisplay = formatMemberDisplay(m, isRefRole ? '' : '');
            const name = m?.name || '';
            return `<div>• ${esc(badgeDisplay ? `${badgeDisplay}: ` : '')}${esc(name)}</div>`;
          })
          .join('');
        const notes = block.text || '';
        return `<div style="padding:6px 0;${header || chips || notes ? '' : 'min-height:18px;'}">
          ${header}${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>${renderCell(notes)}` : ''}
        </div>`;
      })
      .join('<div style="border-top:1px dashed #ddd;"></div>');
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${content || renderCell('')}</td>`;
  }).join('');
  return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
}

function fieldRowWithTime(
  key: string,
  timeKey: string,
  label: string,
  DAYS: ReturnType<typeof getDays>,
  valuesByDay: DayValues[]
): string {
  const tds = DAYS.map((_, i) => {
    const value = valuesByDay[i]?.[key] || '';
    const time = valuesByDay[i]?.[timeKey] || '';
    const header = time ? `<div style="margin-bottom:6px;font-weight:600;">${esc(time)}</div>` : '';
    return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${header}${renderCell(value)}</td>`;
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
  if (listKey === 'refList') {
    return valuesByDay.every(day => normalizeExtraBlocks(day || {}).length === 0);
  }
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
  customRows: CustomRow[] = [],
  rowLabels: RowLabelOverrides = {},
  shootingDayOffset: number = 0
): string {
  const resolveLabel = (key: string, fallbackLabel: string): string =>
    Object.prototype.hasOwnProperty.call(rowLabels, key)
      ? String(rowLabels[key] ?? '')
      : fallbackLabel;

  // Mapeo de fieldKey/listKey a función de generación
  const rowGenerators: Array<{ key: string; generate: () => string; isEmpty: () => boolean }> = [
    {
      key: 'loc',
      generate: () => mergedLocSeqRow(resolveLabel('loc', i18n.t('needs.locationSequences')), DAYS, valuesByDay),
      isEmpty: () => isFieldRowEmpty('loc', valuesByDay) && isFieldRowEmpty('seq', valuesByDay),
    },
    { key: 'shootDay', generate: () => {
      let count = shootingDayOffset;
      const labels = valuesByDay.map(day => {
        const jornada = normalizeJornadaType(day?.crewTipo ?? day?.tipo ?? '').toLowerCase();
        if (jornada === 'rodaje' || jornada === 'rodaje festivo') {
          count += 1;
          return `DÍA ${count}`;
        }
        return '';
      });
	      return simpleRow(resolveLabel('shootDay', i18n.t('needs.shootingDay')), DAYS, labels);
    }, isEmpty: () => {
      return valuesByDay.every(day => {
        const jornada = normalizeJornadaType(day?.crewTipo ?? day?.tipo ?? '').toLowerCase();
        return jornada !== 'rodaje' && jornada !== 'rodaje festivo';
      });
    } },
    {
      key: 'crewList',
      generate: () =>
        listRowWithSchedule(
          resolveLabel('crewList', i18n.t('needs.technicalTeam')),
          'crewList',
          'crewTxt',
          'crewTipo',
          'crewStart',
          'crewEnd',
          DAYS,
          valuesByDay
        ),
      isEmpty: () => isListRowEmpty('crewList', 'crewTxt', valuesByDay),
    },
    {
      key: 'refList',
      generate: () =>
        extraBlocksRow(resolveLabel('refList', i18n.t('needs.reinforcements')), DAYS, valuesByDay),
      isEmpty: () => isListRowEmpty('refList', 'refTxt', valuesByDay),
    },
    { key: 'needTransport', generate: () => fieldRow('needTransport', resolveLabel('needTransport', i18n.t('needs.transport')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needTransport', valuesByDay) },
    { key: 'transportExtra', generate: () => fieldRow('transportExtra', resolveLabel('transportExtra', i18n.t('needs.transportExtra')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('transportExtra', valuesByDay) },
    { key: 'needGroups', generate: () => fieldRow('needGroups', resolveLabel('needGroups', i18n.t('needs.groups')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needGroups', valuesByDay) },
    { key: 'needCranes', generate: () => fieldRow('needCranes', resolveLabel('needCranes', i18n.t('needs.cranes')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needCranes', valuesByDay) },
    { key: 'extraMat', generate: () => fieldRowWithTime('extraMat', 'extraMatTime', resolveLabel('extraMat', i18n.t('needs.extraMaterial')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('extraMat', valuesByDay) },
    { key: 'precall', generate: () => fieldRow('precall', resolveLabel('precall', i18n.t('needs.precall')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('precall', valuesByDay) },
    {
      key: 'preList',
      generate: () =>
        listRowWithSchedule(
          resolveLabel('preList', i18n.t('needs.prelight')),
          'preList',
          'preNote',
          'prelightTipo',
          'preStart',
          'preEnd',
          DAYS,
          valuesByDay
        ),
      isEmpty: () => isListRowEmpty('preList', 'preNote', valuesByDay),
    },
    {
      key: 'pickList',
      generate: () =>
        listRowWithSchedule(
          resolveLabel('pickList', i18n.t('needs.pickup')),
          'pickList',
          'pickNote',
          'pickupTipo',
          'pickStart',
          'pickEnd',
          DAYS,
          valuesByDay
        ),
      isEmpty: () => isListRowEmpty('pickList', 'pickNote', valuesByDay),
    },
    { key: 'needLight', generate: () => fieldRow('needLight', resolveLabel('needLight', i18n.t('needs.lightNeeds')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('needLight', valuesByDay) },
    { key: 'obs', generate: () => fieldRow('obs', resolveLabel('obs', i18n.t('needs.observations')), DAYS, valuesByDay), isEmpty: () => isFieldRowEmpty('obs', valuesByDay) },
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

    const hasShootDay = valuesByDay.some(day => {
      const jornada = String(day?.crewTipo ?? day?.tipo ?? '').trim().toLowerCase();
      return jornada === 'rodaje' || jornada === 'rodaje festivo';
    });
    if (hasShootDay) {
      selectedFields.add('shootDay');
    }
    
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
    day =>
      `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
        ${esc(day.name)}<br/>${esc(formatDDMM(addDays(monday, day.idx)))}
      </th>`
  ).join('');
}
