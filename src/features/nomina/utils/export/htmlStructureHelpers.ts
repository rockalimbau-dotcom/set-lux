import i18n from '../../../../i18n/config';
import { esc } from './helpers';
import { PDF_STYLES } from './pdfStyles';
import { SCREEN_STYLES } from './screenStyles';

interface GenerateHTMLStructureParams {
  title: string;
  project: any;
  monthLabelEs: (key: string, withYear?: boolean) => string;
  monthKey: string;
  head: string;
  body: string;
  isPDF?: boolean;
  helpHtml?: string;
  monthTitle?: string;
  hideSecondaryInfo?: boolean;
}

/**
 * Generate HTML structure for PDF
 */
export function generateHTMLStructure({
  title,
  project,
  monthLabelEs,
  monthKey,
  head,
  body,
  isPDF = true,
  helpHtml = '',
  monthTitle,
  hideSecondaryInfo = false,
}: GenerateHTMLStructureParams): string {
  const styles = isPDF ? PDF_STYLES : SCREEN_STYLES;
  const containerClass = isPDF ? 'container-pdf' : 'container';
  const footerText = isPDF ? i18n.t('footer.generatedBy') : i18n.t('footer.generatedAutomaticallyBy');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || i18n.t('common.project'))} – ${i18n.t('payroll.payrollTitle')} ${esc(monthLabelEs(monthKey, true))}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="${containerClass}">
    <div class="header">
      <div class="title-bar">
        <div class="title-text">${esc(title)}</div>
      </div>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-grid info-grid-top">
          <div class="info-row info-row-left">
            <span class="info-label">Producción:</span>
            <span class="info-value">${esc(project?.productora || project?.produccion || '—')}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">DoP:</span>
            <span class="info-value">${esc(project?.dop || '—')}</span>
          </div>
          <div class="info-row info-row-left">
            <span class="info-label">Proyecto:</span>
            <span class="info-value">${esc(project?.nombre || (isPDF ? i18n.t('common.project') : '—'))}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">Gaffer:</span>
            <span class="info-value">${esc((project as any)?.gaffer || '—')}</span>
          </div>
          <div class="info-row info-row-left">
            <span class="info-label">Almacén:</span>
            <span class="info-value">${esc(project?.almacen || '—')}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label"></span>
            <span class="info-value"></span>
          </div>
        </div>

        ${
          hideSecondaryInfo
            ? ''
            : `
        <div class="info-grid info-grid-secondary">
          <div class="info-row info-row-left">
            <span class="info-label">Jefe de producción:</span>
            <span class="info-value">${esc((project as any)?.jefeProduccion || '—')}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">Localizaciones:</span>
            <span class="info-value">${esc((project as any)?.localizaciones || '—')}</span>
          </div>
          <div class="info-row info-row-left">
            <span class="info-label">Transportes:</span>
            <span class="info-value">${esc((project as any)?.transportes || '—')}</span>
          </div>
          <div class="info-row info-row-right">
            <span class="info-label">Coordinadora de producción:</span>
            <span class="info-value">${esc((project as any)?.coordinadoraProduccion || '—')}</span>
          </div>
        </div>`
        }
      </div>

      ${monthTitle ? `<div class="month-title">${esc(monthTitle)}</div>` : ''}
      
      <div class="table-container">
        <table>
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${helpHtml}
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
</html>`;
}
