import { esc } from '../htmlHelpers';
import { getTranslation } from '../translationHelpers';
import { generatePersonHTML } from './personHTMLHelpers';

/**
 * Generate body HTML grouped by blocks
 */
export function generateBodyByBlocks(
  personsByBlock: { base: string[]; extra: string[]; pre: string[]; pick: string[] },
  extraGroups: Array<{ blockKey: string; people: string[] }>,
  safeSemanaWithData: string[],
  conceptosConDatos: string[],
  finalData: any,
  genderMap?: Record<string, string>,
  project?: any,
  horarioTexto?: (iso: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string
): string {
  const bodyParts: string[] = [];

  bodyParts.push(
    ...personsByBlock.base.map(pk =>
      generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap, project, horarioTexto, horarioPrelight, horarioPickup, horarioExtraByBlock)
    )
  );

  extraGroups.forEach(group => {
    bodyParts.push(
      ...group.people.map(pk =>
        generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap, project, horarioTexto, horarioPrelight, horarioPickup, horarioExtraByBlock)
      )
    );
  });

  bodyParts.push(
    ...personsByBlock.pre.map(pk =>
      generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap, project, horarioTexto, horarioPrelight, horarioPickup, horarioExtraByBlock)
    )
  );

  bodyParts.push(
    ...personsByBlock.pick.map(pk =>
      generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap, project, horarioTexto, horarioPrelight, horarioPickup, horarioExtraByBlock)
    )
  );

  return bodyParts.join('');
}

/**
 * Generate info panel HTML
 */
export function generateInfoPanel(project: any): string {
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
    renderInfoRow(`${getTranslation('pdf.production', 'Producción')}:`, project?.productora || project?.produccion, 'info-row-left'),
    renderInfoRow(`${getTranslation('pdf.dop', 'DoP')}:`, project?.dop, 'info-row-right'),
    renderInfoRow(`${getTranslation('pdf.project', 'Proyecto')}:`, project?.nombre || getTranslation('pdf.project', 'Proyecto'), 'info-row-left'),
    renderInfoRow(`${getTranslation('pdf.gaffer', 'Gaffer')}:`, (project as any)?.gaffer, 'info-row-right'),
    renderInfoRow(`${getTranslation('pdf.warehouse', 'Almacén')}:`, project?.almacen, 'info-row-left'),
    renderInfoRow(`${getTranslation('pdf.bestBoy', 'Best boy')}:`, (project as any)?.bestBoy, 'info-row-right'),
  ].filter(Boolean);
  if (topRows.length % 2 === 1) {
    topRows.push(renderEmptyInfoRow('info-row-right'));
  }
  const secondaryLeftRows = [
    renderInfoRow(`${getTranslation('pdf.productionManager', 'Jefe de producción')}:`, (project as any)?.jefeProduccion, 'info-row'),
    renderInfoRow(`${getTranslation('pdf.transport', 'Jefe transportes')}:`, (project as any)?.transportes, 'info-row'),
  ].filter(Boolean);
  const secondaryRightRows = [
    renderInfoRow(`${getTranslation('pdf.locations', 'Jefe localizaciones')}:`, (project as any)?.localizaciones, 'info-row-right'),
    renderInfoRow(`${getTranslation('pdf.productionCoordinator', 'Coordinadora de producción')}:`, (project as any)?.coordinadoraProduccion, 'info-row-right'),
  ].filter(Boolean);
  const hasSecondaryRows = secondaryLeftRows.length > 0 || secondaryRightRows.length > 0;

  return `
      <div class="info-panel">
        <div class="info-grid info-grid-top">
          ${topRows.join('')}
        </div>

        ${
          hasSecondaryRows
            ? `<div class="info-grid info-grid-secondary">
                <div class="info-column">
                  ${secondaryLeftRows.join('')}
                </div>
                <div class="info-column info-column-right">
                  ${secondaryRightRows.join('')}
                </div>
              </div>`
            : ''
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
      <span>${esc(getTranslation('pdf.generatedWith', 'Generado con'))}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
      <span class="footer-dot">·</span>
      <span class="footer-domain">setlux.app</span>
    </div>
  `;
}

/**
 * Generate header title
 */
export function generateHeaderTitle(title: string | undefined): string {
  return getTranslation('pdf.reportsTitle', 'REPORTES ELÉCTRICOS');
}
