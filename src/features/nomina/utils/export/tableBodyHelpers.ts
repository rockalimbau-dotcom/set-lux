import i18n from '../../../../i18n/config';
import { getBlockFromRole, sortRowsByRole } from './helpers';
import { generateRowDataCells } from './tableHelpers';

interface GenerateTableBodyParams {
  enrichedRows: any[];
  columnVisibility: any;
  numColumns: number;
}

/**
 * Check if a row is a refuerzo
 */
function isRefuerzo(row: any): boolean {
  const originalRole = (row as any)._originalRole || row.role || '';
  const role = String(originalRole).toUpperCase();
  return role.startsWith('REF') && role.length > 3;
}

/**
 * Group rows by block and separate refuerzos
 */
function groupRowsByBlock(enrichedRows: any[]) {
  const rowsByBlock = {
    base: [] as any[],
    refuerzos: [] as any[],
    pre: [] as any[],
    pick: [] as any[],
  };

  enrichedRows.forEach(row => {
    if (isRefuerzo(row)) {
      rowsByBlock.refuerzos.push(row);
    } else {
      const block = getBlockFromRole(row.role);
      rowsByBlock[block].push(row);
    }
  });

  rowsByBlock.base = sortRowsByRole(rowsByBlock.base, 'base');
  rowsByBlock.refuerzos = sortRowsByRole(rowsByBlock.refuerzos, 'base'); // Usar orden base para refuerzos
  rowsByBlock.pre = sortRowsByRole(rowsByBlock.pre, 'pre');
  rowsByBlock.pick = sortRowsByRole(rowsByBlock.pick, 'pick');

  return rowsByBlock;
}

/**
 * Generate block title row HTML
 */
function generateBlockTitle(block: 'base' | 'refuerzos' | 'pre' | 'pick', numColumns: number): string {
  const blockConfig = {
    base: {
      label: i18n.t('team.baseTeam') || 'Equipo base',
      style: 'background:#fff3e0;color:#e65100',
    },
    refuerzos: {
      label: i18n.t('team.reinforcements') || 'Refuerzos',
      style: 'background:#fff8e1;color:#f57c00',
    },
    pre: {
      label: i18n.t('team.prelightTeam') || 'Equipo prelight',
      style: 'background:#e3f2fd;color:#1565c0',
    },
    pick: {
      label: i18n.t('team.pickupTeam') || 'Equipo recogida',
      style: 'background:#e3f2fd;color:#1565c0',
    },
  };

  const config = blockConfig[block];
  return `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:12px 8px;font-weight:700;${config.style};text-align:center !important;vertical-align:middle !important;height:40px;line-height:1.2;display:table-cell;">
          ${config.label}
        </td>
      </tr>`;
}

/**
 * Generate table body HTML grouped by blocks
 */
export function generateTableBody({ enrichedRows, columnVisibility, numColumns }: GenerateTableBodyParams): string {
  const rowsByBlock = groupRowsByBlock(enrichedRows);
  const generateRowHTML = (r: any) => {
    const dataCells = generateRowDataCells(r, columnVisibility);
    return `<tr>${dataCells.join('')}</tr>`;
  };

  const bodyParts: string[] = [];

  // Equipo base (sin refuerzos)
  if (rowsByBlock.base.length > 0) {
    bodyParts.push(generateBlockTitle('base', numColumns));
    bodyParts.push(...rowsByBlock.base.map(generateRowHTML));
  }

  // Refuerzos (separados del equipo base)
  if (rowsByBlock.refuerzos.length > 0) {
    bodyParts.push(generateBlockTitle('refuerzos', numColumns));
    bodyParts.push(...rowsByBlock.refuerzos.map(generateRowHTML));
  }

  // Equipo prelight
  if (rowsByBlock.pre.length > 0) {
    bodyParts.push(generateBlockTitle('pre', numColumns));
    bodyParts.push(...rowsByBlock.pre.map(generateRowHTML));
  }

  // Equipo recogida
  if (rowsByBlock.pick.length > 0) {
    bodyParts.push(generateBlockTitle('pick', numColumns));
    bodyParts.push(...rowsByBlock.pick.map(generateRowHTML));
  }

  return bodyParts.join('');
}

