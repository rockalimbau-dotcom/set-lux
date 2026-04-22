import { getBlockFromRole, sortRowsByRole } from './helpers';
import { generateRowDataCells } from './tableHelpers';

interface GenerateTableBodyParams {
  enrichedRows: any[];
  columnVisibility: any;
  numColumns: number;
  projectMode?: 'semanal' | 'mensual' | 'diario';
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
      const block =
        row?._displayBlock === 'pre'
          ? 'pre'
          : row?._displayBlock === 'pick'
          ? 'pick'
          : getBlockFromRole(row.role);
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
 * Generate table body HTML grouped by blocks
 */
export function generateTableBody({
  enrichedRows,
  columnVisibility,
  numColumns,
  projectMode = 'semanal',
}: GenerateTableBodyParams): string {
  const rowsByBlock = groupRowsByBlock(enrichedRows);
  const useNetAmounts = enrichedRows.length === 1;
  const showIrpfColumn = !useNetAmounts || enrichedRows.some(r => Number(r?._irpfAmount || 0) !== 0);
  const showEstadoColumn = !useNetAmounts || enrichedRows.some(r => Number(r?._estadoAmount || 0) !== 0);
  const showExtraHoursNetColumn =
    !useNetAmounts ||
    !columnVisibility.extraHoursPercent ||
    enrichedRows.some(r => Number(r?._extraHoursAmount || 0) !== 0);
  const generateRowHTML = (r: any) => {
    const dataCells = generateRowDataCells(r, columnVisibility, {
      projectMode,
      useNetAmounts,
      showIrpfColumn,
      showEstadoColumn,
      showExtraHoursNetColumn,
    });
    return `<tr>${dataCells.join('')}</tr>`;
  };

  const bodyParts: string[] = [];

  // Equipo base (sin refuerzos)
  if (rowsByBlock.base.length > 0) {
    bodyParts.push(...rowsByBlock.base.map(generateRowHTML));
  }

  // Refuerzos (separados del equipo base)
  if (rowsByBlock.refuerzos.length > 0) {
    bodyParts.push(...rowsByBlock.refuerzos.map(generateRowHTML));
  }

  // Equipo prelight
  if (rowsByBlock.pre.length > 0) {
    bodyParts.push(...rowsByBlock.pre.map(generateRowHTML));
  }

  // Equipo recogida
  if (rowsByBlock.pick.length > 0) {
    bodyParts.push(...rowsByBlock.pick.map(generateRowHTML));
  }

  return bodyParts.join('');
}
