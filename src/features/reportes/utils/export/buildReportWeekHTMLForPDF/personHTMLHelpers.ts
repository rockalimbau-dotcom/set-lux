import { parseDietas } from '../../text';
import i18n from '../../../../../i18n/config';
import { getRoleBadgeCode, applyGenderToBadge, stripRefuerzoSuffix } from '@shared/constants/roles';
import { esc } from '../htmlHelpers';
import { translateConcept, translateDietItem } from '../translationHelpers';
import {
  calculateTotalForExport,
  isMeaningfulValue,
} from '../dataHelpers';

/**
 * Generate HTML for a person's header row
 * IMPORTANTE: Convertir formato de roles de "G.pre__" a "GP", "REFE.pre__" a "REFE", etc.
 */
function generatePersonHeader(
  pk: string,
  safeSemanaWithData: string[],
  genderMap?: Record<string, string>
): string {
  // El formato del pk es: "role.block__name" donde block puede ser "pre" o "pick"
  // Ejemplos: "G.pre__Nombre", "REFE.pre__Nombre", "G.pick__Nombre", "G__Nombre" (base)
  let role = '';
  let name = '';
  
  if (pk.includes('.pre__')) {
    // Prelight: formato "role.pre__name"
    const [rolePart, ...nameParts] = pk.split('.pre__');
    role = rolePart || '';
    name = nameParts.join('.pre__');
    
    // Convertir: G.pre -> GP, E.pre -> EP, REFE.pre -> REFE, REF.pre -> REF, etc.
    // IMPORTANTE: Todos los refuerzos (REF, REFG, REFE, REFBB, etc.) NO llevan sufijos P o R
    const isRefuerzo = role.startsWith('REF');
    if (!isRefuerzo) {
      // Rol normal: añadir P (G -> GP, E -> EP, etc.)
      role = `${role}P`;
    }
    // Si es refuerzo (REF, REFE, REFG, etc.), mantener sin cambios
  } else if (pk.includes('.pick__')) {
    // Pickup: formato "role.pick__name"
    const [rolePart, ...nameParts] = pk.split('.pick__');
    role = rolePart || '';
    name = nameParts.join('.pick__');
    
    // Convertir: G.pick -> GR, E.pick -> ER, REFE.pick -> REFE, REF.pick -> REF, etc.
    // IMPORTANTE: Todos los refuerzos (REF, REFG, REFE, REFBB, etc.) NO llevan sufijos P o R
    const isRefuerzo = role.startsWith('REF');
    if (!isRefuerzo) {
      // Rol normal: añadir R (G -> GR, E -> ER, etc.)
      role = `${role}R`;
    }
    // Si es refuerzo (REF, REFE, REFG, etc.), mantener sin cambios
  } else {
    // Base: formato "role__name"
    const [rolePart, ...nameParts] = pk.split('__');
    role = rolePart || '';
    name = nameParts.join('__');
    // IMPORTANTE: Para refuerzos, eliminar TODOS los sufijos P o R (REFEP -> REFE, REFERP -> REFER -> REFE)
    if (role.startsWith('REF')) {
      role = stripRefuerzoSuffix(role);
    }
    // Mantener el rol tal cual (G, E, REFE, REFG, etc.) sin sufijos para refuerzos
  }

  // Skip entries with empty or invalid roles/names
  if (!role && !name) {
    return '';
  }

  const gender = genderMap?.[pk];
  const badgeCode = getRoleBadgeCode(role, i18n.language);
  const badgeDisplay = applyGenderToBadge(badgeCode, gender);
  const displayName = badgeDisplay && name ? `${badgeDisplay} — ${name}` : badgeDisplay || name;

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
function generatePersonConceptRows(
  pk: string,
  conceptosConDatos: string[],
  safeSemanaWithData: string[],
  finalData: any
): string {
  return conceptosConDatos
    .filter(c => {
      if (c === 'Dietas') return true;
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
  finalData: any,
  genderMap?: Record<string, string>
): string {
  const header = generatePersonHeader(pk, safeSemanaWithData, genderMap);
  if (!header) return ''; // Skip invalid entries

  const rows = generatePersonConceptRows(pk, conceptosConDatos, safeSemanaWithData, finalData);
  return header + rows;
}

