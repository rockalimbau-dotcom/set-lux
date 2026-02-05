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
  shootingDayOffset: number = 0,
  planFileName?: string
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
  const pdfTitle = 'Calendario Eléctricos';
  const safeValue = (value: unknown): string => {
    const v = String(value ?? '').trim();
    return v ? esc(v) : '—';
  };
  const planName = String(planFileName ?? '').trim();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${esc(project?.nombre || i18n.t('needs.project'))} – ${esc(pdfTitle)} (${esc(translatedWeekLabel)})</title>
      <style>
        ${baseStyles}
        ${containerPDFStyles}
      </style>
    </head>
    <body>
      <div class="container-pdf">
        <div class="header">
          <div class="title-bar">
            <div class="title-text">${esc(pdfTitle)}</div>
            ${
              planName
                ? `<div class="title-subtext">Plan de rodaje: ${esc(planName)}</div>`
                : ''
            }
          </div>

          <div class="info-panel">
            <div class="info-grid info-grid-top">
              <div class="info-row info-row-left">
                <span class="info-label">Producción:</span>
                <span class="info-value">${safeValue(project?.productora || project?.produccion)}</span>
              </div>
              <div class="info-row info-row-right">
                <span class="info-label">DoP:</span>
                <span class="info-value">${safeValue(project?.dop)}</span>
              </div>
              <div class="info-row info-row-left">
                <span class="info-label">Proyecto:</span>
                <span class="info-value">${safeValue(project?.nombre)}</span>
              </div>
              <div class="info-row info-row-right">
                <span class="info-label">Gaffer:</span>
                <span class="info-value">${safeValue((project as any)?.gaffer)}</span>
              </div>
              <div class="info-row info-row-left">
                <span class="info-label">Almacén:</span>
                <span class="info-value">${safeValue(project?.almacen)}</span>
              </div>
              <div class="info-row info-row-right">
                <span class="info-label"></span>
                <span class="info-value"></span>
              </div>
            </div>

            <div class="info-grid info-grid-secondary">
              <div class="info-column">
                <div class="info-row">
                  <span class="info-label">Jefe de producción:</span>
                  <span class="info-value">${safeValue((project as any)?.jefeProduccion)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Transportes:</span>
                  <span class="info-value">${safeValue((project as any)?.transportes)}</span>
                </div>
              </div>
              <div class="info-column info-column-right">
                <div class="info-row">
                  <span class="info-label">Localizaciones:</span>
                  <span class="info-value">${safeValue((project as any)?.localizaciones)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Coordinadora de producción:</span>
                  <span class="info-value">${safeValue((project as any)?.coordinadoraProduccion)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="content">
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
          <span>Generado con</span>
          <span class="setlux-logo">
            <span class="set">Set</span><span class="lux">Lux</span>
          </span>
          <span class="footer-dot">·</span>
          <span class="footer-domain">setlux.app</span>
        </div>
      </div>
    </body>
    </html>
  `;
}
