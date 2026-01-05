import i18n from '../../../../i18n/config';
import { getBlockFromRole, sortRowsByRole } from './helpers';
import { generateRowDataCells } from './tableHelpers';

interface GenerateTableBodyParams {
  enrichedRows: any[];
  columnVisibility: any;
  numColumns: number;
}

/**
 * Group rows by block and sort them
 */
export function groupRowsByBlock(enrichedRows: any[]) {
  const rowsByBlock = {
    base: [] as any[],
    pre: [] as any[],
    pick: [] as any[],
  };

  enrichedRows.forEach(row => {
    const block = getBlockFromRole(row.role);
    rowsByBlock[block].push(row);
  });

  rowsByBlock.base = sortRowsByRole(rowsByBlock.base, 'base');
  rowsByBlock.pre = sortRowsByRole(rowsByBlock.pre, 'pre');
  rowsByBlock.pick = sortRowsByRole(rowsByBlock.pick, 'pick');

  return rowsByBlock;
}

/**
 * Generate block title row HTML
 */
export function generateBlockTitle(block: 'base' | 'pre' | 'pick', numColumns: number): string {
  const blockConfig = {
    base: {
      label: i18n.t('payroll.teamBase'),
      style: 'background:#fff3e0;color:#e65100',
    },
    pre: {
      label: i18n.t('payroll.teamPrelight'),
      style: 'background:#e3f2fd;color:#1565c0',
    },
    pick: {
      label: i18n.t('payroll.teamPickup'),
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

  if (rowsByBlock.base.length > 0) {
    bodyParts.push(generateBlockTitle('base', numColumns));
    bodyParts.push(...rowsByBlock.base.map(generateRowHTML));
  }

  if (rowsByBlock.pre.length > 0) {
    bodyParts.push(generateBlockTitle('pre', numColumns));
    bodyParts.push(...rowsByBlock.pre.map(generateRowHTML));
  }

  if (rowsByBlock.pick.length > 0) {
    bodyParts.push(generateBlockTitle('pick', numColumns));
    bodyParts.push(...rowsByBlock.pick.map(generateRowHTML));
  }

  return bodyParts.join('');
}

