import i18n from '../../../../../i18n/config';
import { renderWithParams } from '../../../condiciones/shared';
import { esc } from '../helpers';

/**
 * Generate blocks HTML from model templates
 */
function generateBlocksFromModel(model: any): string {
  const blocks = [
    [i18n.t('conditions.legend'), renderWithParams(model.legendTemplate, model.params)],
    [i18n.t('conditions.holidays'), renderWithParams(model.festivosTemplate, model.params)],
    [i18n.t('conditions.schedules'), renderWithParams(model.horariosTemplate, model.params)],
    [i18n.t('conditions.perDiems'), renderWithParams(model.dietasTemplate, model.params)],
    [i18n.t('conditions.transportation'), renderWithParams(model.transportesTemplate, model.params)],
    [i18n.t('conditions.accommodation'), renderWithParams(model.alojamientoTemplate, model.params)],
    [i18n.t('conditions.preProduction'), renderWithParams(model.preproTemplate, model.params)],
    [i18n.t('conditions.agreement'), renderWithParams(model.convenioTemplate, model.params)],
  ]
    .map(
      ([title, txt]) => `
      <section>
        <h4>${esc(title)}</h4>
        <div class="legend-content">${txt}</div>
      </section>`
    )
    .join('');

  return blocks;
}

/**
 * Generate info panel HTML
 */
export function generateInfoPanel(project: any, hideSecondaryInfo: boolean = true): string {
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
    renderInfoRow(`${esc(i18n.t('pdf.production'))}:`, project?.productora || project?.produccion, 'info-row-left'),
    renderInfoRow(`${esc(i18n.t('pdf.dop'))}:`, project?.dop, 'info-row-right'),
    renderInfoRow(`${esc(i18n.t('pdf.project'))}:`, project?.nombre || i18n.t('pdf.project'), 'info-row-left'),
    renderInfoRow(`${esc(i18n.t('pdf.gaffer'))}:`, (project as any)?.gaffer, 'info-row-right'),
    renderInfoRow(`${esc(i18n.t('pdf.warehouse'))}:`, project?.almacen, 'info-row-left'),
    renderInfoRow(`${esc(i18n.t('pdf.bestBoy'))}:`, (project as any)?.bestBoy, 'info-row-right'),
  ].filter(Boolean);
  if (topRows.length % 2 === 1) {
    topRows.push(renderEmptyInfoRow('info-row-right'));
  }
  const secondaryLeftRows = [
    renderInfoRow(`${esc(i18n.t('pdf.productionManager'))}:`, (project as any)?.jefeProduccion, 'info-row-left'),
    renderInfoRow(`${esc(i18n.t('pdf.transport'))}:`, (project as any)?.transportes, 'info-row-left'),
  ].filter(Boolean);
  const secondaryRightRows = [
    renderInfoRow(`${esc(i18n.t('pdf.locations'))}:`, (project as any)?.localizaciones, 'info-row-right'),
    renderInfoRow(`${esc(i18n.t('pdf.productionCoordinator'))}:`, (project as any)?.coordinadoraProduccion, 'info-row-right'),
  ].filter(Boolean);
  const hasSecondaryRows = secondaryLeftRows.length > 0 || secondaryRightRows.length > 0;

  return `
    <div class="info-panel">
      <div class="info-grid info-grid-top">
        ${topRows.join('')}
      </div>
      ${
        hideSecondaryInfo || !hasSecondaryRows
          ? ''
          : `
      <div class="info-grid info-grid-secondary">
        ${secondaryLeftRows.join('')}
        ${secondaryRightRows.join('')}
      </div>`
      }
    </div>
  `;
}

/**
 * Generate footer HTML
 */
export function generateFooter(): string {
  return `
    <div class="footer">
      <span>${esc(i18n.t('pdf.generatedWith'))}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
      <span class="footer-dot">·</span>
      <span class="footer-domain">setlux.app</span>
    </div>
  `;
}
