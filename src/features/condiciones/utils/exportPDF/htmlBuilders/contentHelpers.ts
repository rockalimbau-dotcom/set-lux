import i18n from '../../../../../i18n/config';
import { renderWithParams } from '../../../condiciones/shared';
import { esc } from '../helpers';

/**
 * Generate blocks HTML from model templates
 */
export function generateBlocksFromModel(model: any): string {
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
export function generateInfoPanel(project: any): string {
  return `
    <div class="info-panel">
      <div class="info-item">
        <div class="info-label">${i18n.t('common.productionLabel')}</div>
        <div class="info-value">${esc(project?.produccion || '—')}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${i18n.t('common.project')}</div>
        <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
      </div>
    </div>
  `;
}

/**
 * Generate footer HTML
 */
export function generateFooter(): string {
  return `
    <div class="footer">
      <span>${i18n.t('footer.generatedBy')}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  `;
}

