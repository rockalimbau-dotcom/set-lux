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
  return `
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
          <span class="info-value">${esc(project?.nombre || 'Proyecto')}</span>
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
  `;
}

/**
 * Generate footer HTML
 */
export function generateFooter(): string {
  return `
    <div class="footer">
      <span>Generado con</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
      <span class="footer-dot">·</span>
      <span class="footer-domain">setlux.app</span>
    </div>
  `;
}
