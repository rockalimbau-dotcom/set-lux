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
  const footerText = isPDF ? i18n.t('pdf.generatedWith') : i18n.t('footer.generatedAutomaticallyBy');
  const hasValue = (value: unknown): boolean => String(value ?? '').trim() !== '';
  const safeValue = (value: unknown): string => esc(String(value ?? '').trim());
  const renderInfoRow = (label: string, value: unknown, sideClass: string): string =>
    hasValue(value)
      ? `<div class="info-row ${sideClass}">
           <span class="info-label">${label}</span>
           <span class="info-value">${safeValue(value)}</span>
         </div>`
      : '';
  const renderEmptyInfoRow = (sideClass: string): string =>
    `<div class="info-row ${sideClass}">
       <span class="info-label"></span>
       <span class="info-value"></span>
     </div>`;
  const topRows = [
    renderInfoRow(`${i18n.t('pdf.production')}:`, project?.productora || project?.produccion, 'info-row-left'),
    renderInfoRow(`${i18n.t('pdf.dop')}:`, project?.dop, 'info-row-right'),
    renderInfoRow(`${i18n.t('pdf.project')}:`, project?.nombre || (isPDF ? i18n.t('common.project') : ''), 'info-row-left'),
    renderInfoRow(`${i18n.t('pdf.gaffer')}:`, (project as any)?.gaffer, 'info-row-right'),
    renderInfoRow(`${i18n.t('pdf.warehouse')}:`, project?.almacen, 'info-row-left'),
  ].filter(Boolean);
  if (topRows.length % 2 === 1) {
    topRows.push(renderEmptyInfoRow('info-row-right'));
  }
  const secondaryLeftRows = [
    renderInfoRow(`${i18n.t('pdf.productionManager')}:`, (project as any)?.jefeProduccion, 'info-row'),
    renderInfoRow(`${i18n.t('pdf.transport')}:`, (project as any)?.transportes, 'info-row'),
  ].filter(Boolean);
  const secondaryRightRows = [
    renderInfoRow(`${i18n.t('pdf.locations')}:`, (project as any)?.localizaciones, 'info-row-right'),
    renderInfoRow(`${i18n.t('pdf.productionCoordinator')}:`, (project as any)?.coordinadoraProduccion, 'info-row-right'),
  ].filter(Boolean);
  const hasSecondaryRows = secondaryLeftRows.length > 0 || secondaryRightRows.length > 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || i18n.t('pdf.project'))} – ${i18n.t('pdf.payrollTitle')} ${esc(monthLabelEs(monthKey, true))}</title>
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
          ${topRows.join('')}
        </div>

        ${
          hideSecondaryInfo || !hasSecondaryRows
            ? ''
            : `
        <div class="info-grid info-grid-secondary">
          <div class="info-column">
            ${secondaryLeftRows.join('')}
          </div>
          <div class="info-column info-column-right">
            ${secondaryRightRows.join('')}
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
      <span>${esc(footerText)}</span>
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
