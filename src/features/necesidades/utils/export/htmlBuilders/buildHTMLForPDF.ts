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
  const isRestDay = (day: DayValues | undefined): boolean => {
    const raw = day?.crewTipo ?? day?.tipo ?? '';
    const normalized = String(raw).trim().toLowerCase();
    return normalized === 'descanso';
  };

  const hasDayContent = (day: DayValues | undefined): boolean => {
    if (!day) return false;
    const keys = Object.keys(day);
    for (const key of keys) {
      if (key === 'crewTipo' || key === 'tipo') continue;
      const value = (day as any)[key];
      if (Array.isArray(value)) {
        if (value.length > 0) return true;
        continue;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized !== '' && normalized !== 'descanso' && normalized !== 'fin') return true;
        continue;
      }
      if (typeof value === 'number') {
        if (!Number.isNaN(value) && value !== 0) return true;
        continue;
      }
      if (typeof value === 'boolean') {
        if (value) return true;
        continue;
      }
    }
    return false;
  };

  const restDayIdxs = valuesByDay
    .map((day, idx) => (isRestDay(day) && !hasDayContent(day) ? idx : -1))
    .filter(idx => idx >= 0);

  const selectedIdxs = selectedDayIdxs && selectedDayIdxs.length > 0 ? selectedDayIdxs : null;
  const allowedIdxs = DAYS.map((_, idx) => idx).filter(idx => !restDayIdxs.includes(idx));
  const effectiveDayIdxs = selectedIdxs
    ? selectedIdxs.filter(idx => allowedIdxs.includes(idx))
    : allowedIdxs;
  const filteredDays = DAYS.filter((_, idx) => effectiveDayIdxs.includes(idx));
  const filteredValuesByDay = effectiveDayIdxs.map(idx => valuesByDay[idx] || {});
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
