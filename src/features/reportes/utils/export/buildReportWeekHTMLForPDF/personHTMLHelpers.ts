import { parseDietas } from '../../text';
import { esc } from '../htmlHelpers';
import { translateConcept, translateDietItem } from '../translationHelpers';
import {
  calculateTotalForExport,
  isMeaningfulValue,
} from '../dataHelpers';

/**
 * Generate HTML for a person's header row
 */
export function generatePersonHeader(
  pk: string,
  safeSemanaWithData: string[]
): string {
  const [rolePart, ...nameParts] = String(pk).split('__');
  const role = rolePart || '';
  const name = nameParts.join('__');

  // Skip entries with empty or invalid roles/names
  if (!role && !name) {
    return '';
  }

  const displayName = role && name ? `${role} — ${name}` : role || name;

  return `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">
            ${esc(displayName)}
          </td>
          ${safeSemanaWithData
            .map(() => `<td style="border:1px solid #999;padding:6px;">&nbsp;</td>`)
            .join('')}
          <td style="border:1px solid #999;padding:6px;">&nbsp;</td>
        </tr>`;
}

/**
 * Format total value for display
 */
export function formatTotalDisplay(
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
export function formatCellValue(
  cellValue: any,
  concept: string
): string {
  let value = cellValue ?? '';

  // For SI/NO concepts, show "1" instead of "SI" or "Sí"
  if ((concept === 'Nocturnidad' || concept === 'Penalty lunch' || concept === 'Transporte') && value) {
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
export function generatePersonConceptRows(
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
          <td style="border:1px solid #999;padding:6px;">${esc(translateConcept(c))}</td>
          ${safeSemanaWithData
            .map(iso => {
              const cellValue = formatCellValue(finalData?.[pk]?.[c]?.[iso], c);
              return `<td style="border:1px solid #999;padding:6px;">${esc(cellValue)}</td>`;
            })
            .join('')}
          <td style="border:1px solid #999;padding:6px;text-align:left;font-weight:bold;">${esc(totalDisplay)}</td>
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
  finalData: any
): string {
  const header = generatePersonHeader(pk, safeSemanaWithData);
  if (!header) return ''; // Skip invalid entries

  const rows = generatePersonConceptRows(pk, conceptosConDatos, safeSemanaWithData, finalData);
  return header + rows;
}

