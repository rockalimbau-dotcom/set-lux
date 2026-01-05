import i18n from '../../../../i18n/config';
import { BuildNominaMonthHTMLParams } from './types';
import { getColumnVisibility } from './helpers';
import { generateHeaderCells } from './tableHelpers';
import { generateTableBody } from './tableBodyHelpers';
import { generateHTMLStructure } from './htmlStructureHelpers';

export function buildNominaMonthHTMLForPDF({
  project,
  monthKey,
  enrichedRows,
  monthLabelEs,
}: BuildNominaMonthHTMLParams & { _currentPage?: number; _totalPages?: number }): string {
  const columnVisibility = getColumnVisibility(enrichedRows);
  const headerCells = generateHeaderCells(columnVisibility);
  const head = `<tr>${headerCells.join('')}</tr>`;
  const numColumns = headerCells.length;

  const body = generateTableBody({
    enrichedRows,
    columnVisibility,
    numColumns,
  });

  const title = `${i18n.t('payroll.title')} - ${monthLabelEs(monthKey, true)}`;

  return generateHTMLStructure({
    title,
    project,
    monthLabelEs,
    monthKey,
    head,
    body,
  });
}

