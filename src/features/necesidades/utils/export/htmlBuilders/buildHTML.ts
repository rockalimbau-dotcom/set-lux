import i18n from '../../../../../i18n/config';
import { DayValues } from '../types';
import { esc, parseYYYYMMDD, getDays, translateWeekLabel } from '../helpers';
import { generateHeaderRow, generateTableBody } from './tableHelpers';
import { baseStyles, containerStyles } from './styles';

/**
 * Build HTML for necesidades (for viewing)
 */
export function buildNecesidadesHTML(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  const monday = parseYYYYMMDD(weekStart);
  const DAYS = getDays();
  const translatedWeekLabel = translateWeekLabel(weekLabel);
  const headerRow = generateHeaderRow(DAYS, monday);
  const body = generateTableBody(DAYS, valuesByDay);

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
        ${containerStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${i18n.t('needs.title')} - ${titleSuffix}</h1>
        </div>
        
        <div class="content">
          <div class="info-panel">
            <div class="info-item">
              <div class="info-label">${i18n.t('needs.productionCompany')}</div>
              <div class="info-value">${esc(project?.produccion || '—')}</div>
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

