import { formatParsedDietasForExport, parseDietas } from '../../text';
import i18n from '../../../../../i18n/config';
import { getRoleBadgeCode, applyGenderToBadge, stripRefuerzoSuffix } from '@shared/constants/roles';
import { esc } from '../htmlHelpers';
import { translateConcept, translateDietItem } from '../translationHelpers';
import {
  calculateTotalForExport,
  isMeaningfulValue,
  parsePersonKey,
  resolveExportRoleMeta,
} from '../dataHelpers';
import { extractNumericValue } from '../../runtime';
import { normalizeJornadaType } from '@shared/utils/jornadaTranslations';
import { getNeedsDayTypePalette } from '@features/necesidades/utils/dayTypeColors';
import {
  formatJornadaCellForExport,
  isRestJornadaLabel,
  normalizeJornadaToneKey,
} from '../reportJornadaDisplay';

function scheduleForPerson(
  pk: string,
  iso: string,
  finalData: any,
  horarioTexto?: (iso: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string,
  resolvedBlock?: string
): string {
  const parsed = parsePersonKey(pk);
  const block = resolvedBlock || parsed.block || 'base';
  const saved = finalData?.__schedule__?.[pk]?.[block]?.[iso];
  if (saved?.start || saved?.end) {
    return `${saved?.start || ''} ${saved?.end || ''}`.trim();
  }
  if (block === 'pre' && typeof horarioPrelight === 'function') return horarioPrelight(iso);
  if (block === 'pick' && typeof horarioPickup === 'function') return horarioPickup(iso);
  if (String(block).startsWith('extra') && typeof horarioExtraByBlock === 'function') {
    return horarioExtraByBlock(block, iso);
  }
  return typeof horarioTexto === 'function' ? horarioTexto(iso) : '';
}

function normalizeToneKey(value: string): string {
  return normalizeJornadaToneKey(value);
}

function extractJornadaLabelForTone(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.split('|')[0]?.trim() || raw;
}

function getScheduleTone(schedule: string): {
  bg: string;
  text: string;
  border: string;
} {
  const canonical = normalizeJornadaType(extractJornadaLabelForTone(schedule));
  const palette = getNeedsDayTypePalette(canonical, 'light');
  if (palette) {
    return {
      bg: palette.bg,
      text: palette.controlText,
      border: palette.border,
    };
  }

  const normalized = normalizeToneKey(schedule);

  if (!normalized) return { bg: '#ffffff', text: '#475569', border: '#e2e8f0' };
  if (normalized.includes('descanso') || normalized.includes('descans') || normalized.includes('rest')) {
    return { bg: '#e2e8f0', text: '#334155', border: '#94a3b8' };
  }

  return { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' };
}

function getBlockColors(blockKey?: string): {
  personBg: string;
  personCellBg: string;
  conceptBg: string;
  totalBg: string;
} {
  if (blockKey === 'pre') {
    return {
      personBg: '#fffbeb',
      personCellBg: '#fffdf5',
      conceptBg: '#fffef8',
      totalBg: '#fef3c7',
    };
  }
  if (blockKey === 'pick') {
    return {
      personBg: '#f5f3ff',
      personCellBg: '#faf7ff',
      conceptBg: '#fcfbff',
      totalBg: '#ede9fe',
    };
  }
  if (blockKey && blockKey.startsWith('extra')) {
    return {
      personBg: '#ecfdf5',
      personCellBg: '#f4fdf8',
      conceptBg: '#f7fef9',
      totalBg: '#d1fae5',
    };
  }
  return {
    personBg: '#f8fafc',
    personCellBg: '#ffffff',
    conceptBg: '#ffffff',
    totalBg: '#eff6ff',
  };
}

/**
 * Generate HTML for a person's header row
 * IMPORTANTE: Convertir formato de roles de "G.pre__" a "GP", "REFE.pre__" a "REFE", etc.
 */
function generatePersonHeader(
  pk: string,
  safeSemanaWithData: string[],
  finalData: any,
  genderMap?: Record<string, string>,
  project?: any,
  horarioTexto?: (iso: string) => string,
  jornadaTipoTexto?: (iso: string, blockKey?: string) => string,
  jornadaTipoPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string,
  resolvePersonaBlockKey?: (pk: string, iso: string, blockKey?: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string,
  horarioPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string,
  blockKey?: string
): string {
  // El formato del pk es: "role.block__name" donde block puede ser "pre" o "pick"
  // Ejemplos: "G.pre__Nombre", "REFE.pre__Nombre", "G.pick__Nombre", "G__Nombre" (base)
  const parsed = parsePersonKey(pk);
  let role = parsed.role;
  const name = parsed.name;
  const exportRole = resolveExportRoleMeta(project, parsed.role);
  role = exportRole.displayRole;
  if (role.startsWith('REF')) {
    role = stripRefuerzoSuffix(role);
  }

  // Skip entries with empty or invalid roles/names
  if (!role && !name) {
    return '';
  }

  const gender = genderMap?.[pk];
  const badgeCode = getRoleBadgeCode(role, i18n.language);
  const badgeDisplay = applyGenderToBadge(badgeCode, gender);
  const displayName = `
    <div class="person-label">
      <span class="person-role">${esc(badgeDisplay || '—')}</span>
      <span class="person-name">${esc(name || '—')}</span>
    </div>
  `;
  const colors = getBlockColors(blockKey);

  return `
        <tr>
          <td style="border:1px solid #e2e8f0;padding:6px;font-weight:600;background:${colors.personBg};vertical-align:middle;">
            ${displayName}
          </td>
          ${safeSemanaWithData.map(iso => {
            const currentBlockKey =
              typeof resolvePersonaBlockKey === 'function'
                ? resolvePersonaBlockKey(pk, iso, blockKey || parsed.block || 'base')
                : blockKey || parsed.block || 'base';
            const jornadaType =
              typeof jornadaTipoPersonaTexto === 'function'
                ? jornadaTipoPersonaTexto(pk, iso, currentBlockKey)
                : typeof jornadaTipoTexto === 'function'
                ? jornadaTipoTexto(iso, currentBlockKey)
                : '';
            const savedSchedule = finalData?.__schedule__?.[pk]?.[currentBlockKey]?.[iso];
            let schedule = '';
            if (savedSchedule?.start || savedSchedule?.end) {
              schedule = `${savedSchedule?.start || ''} ${savedSchedule?.end || ''}`.trim();
            } else if (typeof horarioPersonaTexto === 'function') {
              schedule = horarioPersonaTexto(pk, iso, blockKey || parsed.block || 'base');
            } else {
              schedule = scheduleForPerson(
                pk,
                iso,
                finalData,
                horarioTexto,
                horarioPrelight,
                horarioPickup,
                horarioExtraByBlock,
                currentBlockKey
              );
            }
            const effectiveSchedule = isRestJornadaLabel(jornadaType) ? '' : schedule;
            const displayValue = formatJornadaCellForExport(jornadaType, effectiveSchedule);
            const tone = getScheduleTone(jornadaType || schedule);
            return `<td style="border:1px solid ${tone.border};padding:6px;text-align:center;vertical-align:middle;background:${tone.bg};"><div class="td-label td-label-center" style="font-weight:700;color:${tone.text};">${esc(displayValue)}</div></td>`;
          }).join('')}
          <td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;background:${colors.personCellBg};"><div class="td-label td-label-center">&nbsp;</div></td>
        </tr>`;
}

/**
 * Format total value for display
 */
function formatTotalDisplay(
  total: any,
  concept: string
): string {
  if (total === '') {
    return '';
  } else if (concept === 'Dietas' && typeof total === 'object' && total !== null && 'breakdown' in total) {
    const breakdown = (total as { breakdown: Map<string, number> }).breakdown;
    if (breakdown.size > 0) {
      return Array.from(breakdown.entries())
        .map(([item, count]) => `x${count} ${translateDietItem(item)}`)
        .join(', ');
    }
  } else if (typeof total === 'number') {
    return total % 1 === 0 ? total.toString() : total.toFixed(2);
  } else {
    return total.toString();
  }
  return '';
}

/**
 * Format cell value for display
 */
function formatCellValue(
  cellValue: any,
  concept: string
): string {
  let value = cellValue ?? '';

  // For SI/NO concepts, show "1" instead of "SI" or "Sí"
  if ((concept === 'Nocturnidad' || concept === 'Penalty lunch' || concept === 'Transporte' || concept === 'Material propio') && value) {
    const trimmedValue = value.toString().trim().toLowerCase();
    if (trimmedValue === 'sí' || trimmedValue === 'si') {
      value = '1';
    }
  }

  if (concept === 'Dietas' && value && value.toString().trim() !== '') {
    try {
      value = formatParsedDietasForExport(parseDietas(value), translateDietItem);
    } catch {
      // usar valor original
    }
  }

  return value;
}

function isNumericLike(value: any): boolean {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  return /^-?\d+([.,]\d+)?$/.test(raw);
}

function hasVisibleValue(value: any): boolean {
  return String(value ?? '').trim() !== '';
}

function shouldHighlightCell(
  concept: string,
  cellValue: any,
  horasExtraTipo?: string
): boolean {
  if (isNumericLike(cellValue)) return true;
  if (concept === 'Horas extra') {
    const num = extractNumericValue(String(cellValue ?? ''));
    return !isNaN(num) && num > 0;
  }
  return false;
}

/**
 * Generate HTML for a person's concept rows
 */
function generatePersonConceptRows(
  pk: string,
  conceptosConDatos: string[],
  safeSemanaWithData: string[],
  finalData: any,
  blockKey?: string,
  horasExtraTipo?: string
): string {
  const colors = getBlockColors(blockKey);
  return conceptosConDatos
    .filter(c => {
      // Only show concepts that have meaningful data for this person
      return safeSemanaWithData.some(iso => {
        const value = finalData?.[pk]?.[c]?.[iso];
        return isMeaningfulValue(value);
      });
    })
    .map(c => {
      const total = calculateTotalForExport(finalData, pk, c, safeSemanaWithData, true, horasExtraTipo);
      const totalDisplay = formatTotalDisplay(total, c);

      return `
        <tr>
          <td style="border:1px solid #e2e8f0;padding:6px;vertical-align:middle;background:${colors.conceptBg};"><div class="td-label">${esc(translateConcept(c))}</div></td>
          ${safeSemanaWithData
            .map(iso => {
              const cellValue = formatCellValue(finalData?.[pk]?.[c]?.[iso], c);
              const highlight = shouldHighlightCell(c, cellValue, horasExtraTipo);
              const dietHighlight = c === 'Dietas' && hasVisibleValue(cellValue);
              const background = colors.conceptBg;
              const textStyle = highlight
                ? 'font-weight:700;color:#c2410c;'
                : dietHighlight
                ? 'font-weight:700;color:#c2410c;'
                : '';
              return `<td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;background:${background};"><div class="td-label td-label-center" style="${textStyle}">${esc(cellValue)}</div></td>`;
            })
            .join('')}
          <td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;font-weight:bold;background:${totalDisplay ? '#fef3c7' : colors.totalBg};"><div class="td-label td-label-center" style="${totalDisplay ? 'color:#92400e;font-weight:800;' : ''}">${esc(totalDisplay)}</div></td>
        </tr>`;
    })
    .join('');
}

/**
 * Generate complete HTML for a person
 */
export function generatePersonHTML(
  pk: string,
  conceptosConDatos: string[],
  safeSemanaWithData: string[],
  finalData: any,
  genderMap?: Record<string, string>,
  project?: any,
  horarioTexto?: (iso: string) => string,
  jornadaTipoTexto?: (iso: string, blockKey?: string) => string,
  jornadaTipoPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string,
  resolvePersonaBlockKey?: (pk: string, iso: string, blockKey?: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string,
  horarioPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string,
  blockKey?: string,
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[],
  horasExtraTipo?: string
): string {
  const header = generatePersonHeader(
    pk,
    safeSemanaWithData,
    finalData,
    genderMap,
    project,
    horarioTexto,
    jornadaTipoTexto,
    jornadaTipoPersonaTexto,
    resolvePersonaBlockKey,
    horarioPrelight,
    horarioPickup,
    horarioExtraByBlock,
    horarioPersonaTexto,
    blockKey
  );
  if (!header) return ''; // Skip invalid entries

  const conceptsForPerson = adjustConceptsForExport
    ? adjustConceptsForExport(pk, conceptosConDatos)
    : conceptosConDatos;

  const rows = generatePersonConceptRows(pk, conceptsForPerson, safeSemanaWithData, finalData, blockKey, horasExtraTipo);
  return `<tbody class="person-block">${header}${rows}</tbody>`;
}
