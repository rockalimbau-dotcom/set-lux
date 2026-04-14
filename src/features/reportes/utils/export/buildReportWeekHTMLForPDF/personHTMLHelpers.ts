import { parseDietas } from '../../text';
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

function scheduleForPerson(
  pk: string,
  iso: string,
  finalData: any,
  horarioTexto?: (iso: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string
): string {
  const parsed = parsePersonKey(pk);
  const block = parsed.block || 'base';
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
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string
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
    <div class="person-chip-wrap">
      <div class="member-chip-line">
        <span class="member-chip-badge"><span class="member-chip-badge-text">${esc(badgeDisplay || '—')}</span></span>
        <span class="member-chip-name"><span class="member-chip-name-text">${esc(name || '—')}</span></span>
      </div>
    </div>
  `;

  return `
        <tr>
          <td style="border:1px solid #e2e8f0;padding:6px;font-weight:600;background:#f8fafc;vertical-align:middle;">
            ${displayName}
          </td>
          ${safeSemanaWithData
            .map(
              iso => `<td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;"><div class="td-label td-label-center">${esc(
                scheduleForPerson(pk, iso, finalData, horarioTexto, horarioPrelight, horarioPickup, horarioExtraByBlock)
              )}</div></td>`
            )
            .join('')}
          <td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;"><div class="td-label td-label-center">&nbsp;</div></td>
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

  // Translate diet items if concept is Dietas
  if (concept === 'Dietas' && value && value.toString().trim() !== '') {
    try {
      const parsed = parseDietas(value);
      const translatedItems =
        parsed.items.size > 0
          ? Array.from(parsed.items).map(item => translateDietItem(item))
          : [];
      value = translatedItems.join(' + ');
      if (parsed.ticket !== null) {
        value += (translatedItems.length > 0 ? ' + ' : '') + `Ticket(${parsed.ticket})`;
      }
    } catch (e) {
      // If parsing fails, use original value
    }
  }

  return value;
}

/**
 * Generate HTML for a person's concept rows
 */
function generatePersonConceptRows(
  pk: string,
  conceptosConDatos: string[],
  safeSemanaWithData: string[],
  finalData: any
): string {
  return conceptosConDatos
    .filter(c => {
      // Only show concepts that have meaningful data for this person
      return safeSemanaWithData.some(iso => {
        const value = finalData?.[pk]?.[c]?.[iso];
        return isMeaningfulValue(value);
      });
    })
    .map(c => {
      const total = calculateTotalForExport(finalData, pk, c, safeSemanaWithData, true);
      const totalDisplay = formatTotalDisplay(total, c);

      return `
        <tr>
          <td style="border:1px solid #e2e8f0;padding:6px;vertical-align:middle;"><div class="td-label">${esc(translateConcept(c))}</div></td>
          ${safeSemanaWithData
            .map(iso => {
              const cellValue = formatCellValue(finalData?.[pk]?.[c]?.[iso], c);
              return `<td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;"><div class="td-label td-label-center">${esc(cellValue)}</div></td>`;
            })
            .join('')}
          <td style="border:1px solid #e2e8f0;padding:6px;text-align:center;vertical-align:middle;font-weight:bold;"><div class="td-label td-label-center">${esc(totalDisplay)}</div></td>
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
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string
): string {
  const header = generatePersonHeader(
    pk,
    safeSemanaWithData,
    finalData,
    genderMap,
    project,
    horarioTexto,
    horarioPrelight,
    horarioPickup,
    horarioExtraByBlock
  );
  if (!header) return ''; // Skip invalid entries

  const rows = generatePersonConceptRows(pk, conceptosConDatos, safeSemanaWithData, finalData);
  return header + rows;
}
