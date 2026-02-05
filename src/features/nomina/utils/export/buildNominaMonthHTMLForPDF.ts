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
  showHelp = false,
  hideSecondaryInfo,
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

  const title = i18n.t('pdf.payrollTitle');
  const monthTitle = monthLabelEs(monthKey, true);
  const helpHtml = showHelp
    ? `
      <div class="payroll-help">
        <div class="payroll-help-title">${i18n.t('payroll.understandPayroll')}</div>
        <div class="payroll-help-body">
          <div class="payroll-help-image">
            <img src="/Como_entender_nomina.png" alt="${i18n.t('payroll.understandPayrollAlt')}" />
          </div>
          <div class="payroll-help-legend">
            <div class="payroll-help-item">
              <span class="payroll-help-color payroll-help-pink"></span>
              <span>${i18n.t('payroll.legendBase')} <span class="payroll-help-detail">${i18n.t('payroll.legendBaseDetail')}</span></span>
            </div>
            <div class="payroll-help-item">
              <span class="payroll-help-color payroll-help-yellow"></span>
              <span>${i18n.t('payroll.legendTransport')}</span>
            </div>
            <div class="payroll-help-item">
              <span class="payroll-help-color payroll-help-green"></span>
              <span>${i18n.t('payroll.legendDietas')}</span>
            </div>
            <div class="payroll-help-item">
              <span class="payroll-help-color payroll-help-blue"></span>
              <span>${i18n.t('payroll.legendExtras')}</span>
            </div>
            <div class="payroll-help-item">
              <span class="payroll-help-color payroll-help-orange"></span>
              <span>${i18n.t('payroll.legendBruto')}</span>
            </div>
          </div>
        </div>
      </div>
    `
    : '';

  const shouldHideSecondaryInfo =
    typeof hideSecondaryInfo === 'boolean' ? hideSecondaryInfo : enrichedRows.length === 1;

  return generateHTMLStructure({
    title,
    monthTitle,
    project,
    monthLabelEs,
    monthKey,
    head,
    body,
    helpHtml,
    hideSecondaryInfo: shouldHideSecondaryInfo,
  });
}
