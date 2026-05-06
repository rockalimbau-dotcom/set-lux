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

  /** Stack rows in one column so missing fields do not break a 2-column CSS grid. */
  const appendField = (stack: string[], label: string, value: unknown, alignRight: boolean) => {
    if (!hasValue(value)) return;
    const rowClass = alignRight ? 'info-row info-row-right' : 'info-row';
    stack.push(
      `<div class="${rowClass}">
         <span class="info-label">${label}</span>
         <span class="info-value">${safeValue(value)}</span>
       </div>`
    );
  };

  const leftStack: string[] = [];
  appendField(leftStack, `${i18n.t('pdf.production')}:`, project?.productora || project?.produccion, false);
  appendField(
    leftStack,
    `${i18n.t('pdf.project')}:`,
    project?.nombre || (isPDF ? i18n.t('common.project') : ''),
    false
  );
  appendField(leftStack, `${i18n.t('pdf.warehouse')}:`, project?.almacen, false);

  const rightStack: string[] = [];
  appendField(rightStack, `${i18n.t('pdf.dop')}:`, project?.dop, true);
  appendField(rightStack, `${i18n.t('pdf.gaffer')}:`, (project as any)?.gaffer, true);
  appendField(rightStack, `${i18n.t('pdf.bestBoy')}:`, (project as any)?.bestBoy, true);

  const showSecondary = !hideSecondaryInfo;
  if (showSecondary) {
    appendField(leftStack, `${i18n.t('pdf.productionManager')}:`, (project as any)?.jefeProduccion, false);
    appendField(leftStack, `${i18n.t('pdf.transport')}:`, (project as any)?.transportes, false);
    appendField(rightStack, `${i18n.t('pdf.locations')}:`, (project as any)?.localizaciones, true);
    appendField(
      rightStack,
      `${i18n.t('pdf.productionCoordinator')}:`,
      (project as any)?.coordinadoraProduccion,
      true
    );
  }

  const hasPanelContent = leftStack.length > 0 || rightStack.length > 0;

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
      ${
        hasPanelContent
          ? `<div class="info-panel">
        <div class="info-panel-columns">
          <div class="info-panel-stack">${leftStack.join('')}</div>
          <div class="info-panel-stack info-panel-stack--right">${rightStack.join('')}</div>
        </div>
      </div>`
          : ''
      }

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
