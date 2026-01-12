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
      <h1>${title}</h1>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">${i18n.t('common.productionLabel')}</div>
          <div class="info-value">${esc(project?.productora || project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${i18n.t('common.project')}</div>
          <div class="info-value">${esc(project?.nombre || (isPDF ? i18n.t('common.project') : '—'))}</div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <span>${footerText}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;
}
