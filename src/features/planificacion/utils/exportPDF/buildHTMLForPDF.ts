import { Week, DayInfo } from './types';
import { esc, getTranslation, translateWeekLabel } from './helpers';
import { generateWeekTable } from './weekTableHelpers';
import { PLANIFICACION_PDF_STYLES } from './planificacionPDFStyles';

/**
 * Build HTML for PDF export
 */
export function buildPlanificacionHTMLForPDF(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date,
  scope?: 'pre' | 'pro'
): string {
  const weekTables = weeks.map(w => generateWeekTable({
    week: w,
    DAYS,
    parseYYYYMMDD,
    addDays,
  })).join('');

  const scopeTitle = scope === 'pre' 
    ? esc(getTranslation('planning.preproduction', 'Preproducción'))
    : scope === 'pro' 
    ? esc(getTranslation('planning.production', 'Producción'))
    : esc(translateWeekLabel(weeks[0]?.label || getTranslation('planning.week', 'Semana')));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))} – ${esc(getTranslation('common.planning', 'Planificación'))}</title>
  <style>${PLANIFICACION_PDF_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${esc(getTranslation('common.planning', 'Planificación'))} - ${scopeTitle}</h1>
    </div>
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.productionLabel', 'Producción'))}</div>
          <div class="info-value">${esc(project?.productora || project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.project', 'Proyecto'))}</div>
          <div class="info-value">${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))}</div>
        </div>
      </div>
      <div class="week-title">${esc(translateWeekLabel(weeks[0]?.label || getTranslation('planning.week', 'Semana')))}</div>
      <div class="table-container">
        ${weekTables}
      </div>
    </div>
    <div class="footer">
      <span>${esc(getTranslation('footer.generatedBy', 'Generado automáticamente por'))} <span class="setlux-logo"><span class="set">Set</span><span class="lux">Lux</span></span></span>
    </div>
  </div>
</body>
</html>`;
}

