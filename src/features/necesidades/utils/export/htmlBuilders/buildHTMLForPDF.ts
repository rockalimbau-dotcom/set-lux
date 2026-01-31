import i18n from '../../../../../i18n/config';
import { CustomRow, DayValues } from '../types';
import { esc, parseYYYYMMDD, getDays, translateWeekLabel } from '../helpers';
import { generateHeaderRow, generateTableBody } from './tableHelpers';
import { baseStyles, containerPDFStyles } from './styles';

/**
 * Build HTML for necesidades PDF
 */
export function buildNecesidadesHTMLForPDF(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[],
  selectedRowKeys?: string[], // Filas seleccionadas para filtrar qué mostrar
  selectedDayIdxs?: number[], // Columnas seleccionadas (días)
  includeEmptyRows?: boolean, // Incluir filas vacías
  customRows?: CustomRow[],
  shootingDayOffset: number = 0
): string {
  const monday = parseYYYYMMDD(weekStart);
  const DAYS = getDays();
  const filteredDayIdxs = selectedDayIdxs && selectedDayIdxs.length > 0
    ? selectedDayIdxs
    : null;
  const filteredDays = filteredDayIdxs
    ? DAYS.filter((_, idx) => filteredDayIdxs.includes(idx))
    : DAYS;
  const filteredValuesByDay = filteredDayIdxs
    ? filteredDayIdxs.map(idx => valuesByDay[idx] || {})
    : valuesByDay;
  const translatedWeekLabel = translateWeekLabel(weekLabel);
  const headerRow = generateHeaderRow(filteredDays, monday);
  const body = generateTableBody(
    filteredDays,
    filteredValuesByDay,
    selectedRowKeys,
    includeEmptyRows,
    customRows,
    shootingDayOffset
  );

  const titleSuffix = weekLabel.includes('-')
    ? i18n.t('needs.preproduction')
    : weekLabel.match(/\d+/)
    ? i18n.t('needs.production')
    : i18n.t('needs.week');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${esc(project?.nombre || i18n.t('needs.project'))} – ${i18n.t('needs.shootingNeeds')} (${esc(translatedWeekLabel)})</title>
      <style>
        ${baseStyles}
        ${containerPDFStyles}
      </style>
    </head>
    <body>
      <div class="container-pdf">
        <div class="header">
          <h1>${i18n.t('needs.title')} - ${titleSuffix}</h1>
        </div>
        
        <div class="content">
          <div class="info-panel">
            <div class="info-item">
              <div class="info-label">${i18n.t('needs.productionCompany')}</div>
              <div class="info-value">${esc(project?.productora || project?.produccion || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">${i18n.t('needs.project')}</div>
              <div class="info-value">${esc(project?.nombre || i18n.t('needs.project'))}</div>
            </div>
          </div>
          
          <div class="week-title">${esc(translatedWeekLabel)}</div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>${i18n.t('needs.fieldDay')}</th>
                  ${headerRow}
                </tr>
              </thead>
              <tbody>
                ${body}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          <span>${i18n.t('footer.generatedBy')}</span>
          <span class="setlux-logo">
            <span class="set">Set</span><span class="lux">Lux</span>
          </span>
        </div>
      </div>
    </body>
    </html>
  `;
}

