import i18n from '../../../../i18n/config';
import { BuildNominaMonthHTMLParams } from './types';
import { getColumnVisibility } from './helpers';
import { generateHeaderCells } from './tableHelpers';
import { generateTableBody } from './tableBodyHelpers';
import { generateHTMLStructure } from './htmlStructureHelpers';

export function buildNominaMonthHTML({
  project,
  monthKey,
  enrichedRows,
  monthLabelEs,
}: BuildNominaMonthHTMLParams): string {
  const isIndividualExport = enrichedRows.length === 1;
  const columnVisibility = {
    ...getColumnVisibility(enrichedRows),
    netColumns: isIndividualExport && enrichedRows.some(r => !!r._showNetColumns),
    extraHoursPercent: isIndividualExport && enrichedRows.some(r => !!r._showExtraHoursPercent),
  };
  const projectMode = project?.conditions?.tipo === 'mensual' ? 'mensual' : project?.conditions?.tipo === 'diario' ? 'diario' : 'semanal';
  const headerCells = generateHeaderCells(columnVisibility, projectMode);
  const head = `<tr>${headerCells.join('')}</tr>`;
  const numColumns = headerCells.length;

  const body = generateTableBody({
    enrichedRows,
    columnVisibility,
    numColumns,
    projectMode,
  });

  const title = `${i18n.t('payroll.title')} - ${monthLabelEs(monthKey, true)}`;

  const shouldHideSecondaryInfo = enrichedRows.length === 1;

  return generateHTMLStructure({
    title,
    project,
    monthLabelEs,
    monthKey,
    head,
    body,
    isPDF: false,
    hideSecondaryInfo: shouldHideSecondaryInfo,
  });
}
