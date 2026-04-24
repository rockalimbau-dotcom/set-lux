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
  jornadaTipoTexto?: (iso: string, blockKey?: string) => string,
  jornadaTipoPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string,
  resolvePersonaBlockKey?: (pk: string, iso: string, blockKey?: string) => string,
  horarioPrelight?: (iso: string) => string,
  horarioPickup?: (iso: string) => string,
  horarioExtraByBlock?: (blockKey: string, iso: string) => string
): string {
  const bodyParts: string[] = [];
  bodyParts.push(
    ...personsByBlock.base.map(pk =>
      generatePersonHTML(
        pk,
        conceptosConDatos,
        safeSemanaWithData,
        finalData,
        genderMap,
        project,
        horarioTexto,
        jornadaTipoTexto,
        jornadaTipoPersonaTexto,
        resolvePersonaBlockKey,
        horarioPrelight,
        horarioPickup,
        horarioExtraByBlock,
        'base'
      )
    )
  );

  extraGroups.forEach(group => {
    bodyParts.push(
      ...group.people.map(pk =>
        generatePersonHTML(
          pk,
          conceptosConDatos,
          safeSemanaWithData,
          finalData,
          genderMap,
          project,
          horarioTexto,
          jornadaTipoTexto,
          jornadaTipoPersonaTexto,
          resolvePersonaBlockKey,
          horarioPrelight,
          horarioPickup,
          horarioExtraByBlock,
          group.blockKey
        )
      )
    );
  });

  bodyParts.push(
    ...personsByBlock.pre.map(pk =>
      generatePersonHTML(
        pk,
        conceptosConDatos,
        safeSemanaWithData,
        finalData,
        genderMap,
        project,
        horarioTexto,
        jornadaTipoTexto,
        jornadaTipoPersonaTexto,
        resolvePersonaBlockKey,
        horarioPrelight,
        horarioPickup,
        horarioExtraByBlock,
        'pre'
      )
    )
  );

  bodyParts.push(
    ...personsByBlock.pick.map(pk =>
      generatePersonHTML(
        pk,
        conceptosConDatos,
        safeSemanaWithData,
        finalData,
        genderMap,
        project,
        horarioTexto,
        jornadaTipoTexto,
        jornadaTipoPersonaTexto,
        resolvePersonaBlockKey,
        horarioPrelight,
        horarioPickup,
        horarioExtraByBlock,
        'pick'
      )
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
  const renderInfoItem = (label: string, value: unknown, sideClass: string): string =>
    hasValue(value)
      ? `<div class="info-item ${sideClass}">
           <span class="info-label">${label}</span>
           <span class="info-value">${safeValue(value)}</span>
         </div>`
      : '';
  const leftRows = [
    renderInfoItem(`${getTranslation('pdf.production', 'Producción')}:`, project?.productora || project?.produccion, 'info-item-left'),
    renderInfoItem(`${getTranslation('pdf.project', 'Proyecto')}:`, project?.nombre || getTranslation('pdf.project', 'Proyecto'), 'info-item-left'),
    renderInfoItem(`${getTranslation('pdf.warehouse', 'Almacén')}:`, project?.almacen, 'info-item-left'),
    renderInfoItem(`${getTranslation('pdf.productionManager', 'Jefe de producción')}:`, (project as any)?.jefeProduccion, 'info-item-left'),
    renderInfoItem(`${getTranslation('pdf.transport', 'Jefe transportes')}:`, (project as any)?.transportes, 'info-item-left'),
  ].filter(Boolean);
  const rightRows = [
    renderInfoItem(`${getTranslation('pdf.dop', 'DoP')}:`, project?.dop, 'info-item-right'),
    renderInfoItem(`${getTranslation('pdf.gaffer', 'Gaffer')}:`, (project as any)?.gaffer, 'info-item-right'),
    renderInfoItem(`${getTranslation('pdf.bestBoy', 'Best boy')}:`, (project as any)?.bestBoy, 'info-item-right'),
    renderInfoItem(`${getTranslation('pdf.locations', 'Jefe localizaciones')}:`, (project as any)?.localizaciones, 'info-item-right'),
    renderInfoItem(`${getTranslation('pdf.productionCoordinator', 'Coordinadora de producción')}:`, (project as any)?.coordinadoraProduccion, 'info-item-right'),
  ].filter(Boolean);
  const hasRows = leftRows.length > 0 || rightRows.length > 0;
  const singleColumn = leftRows.length === 0 || rightRows.length === 0;
  const singleColumnRows = leftRows.length > 0 ? leftRows : rightRows;

  if (!hasRows) return '';

  return `
      <div class="info-panel">
        <div class="info-grid ${singleColumn ? 'info-grid-single' : ''}">
          ${
            singleColumn
              ? `<div class="info-column">
                  ${singleColumnRows.join('')}
                </div>`
              : `<div class="info-column">
                  ${leftRows.join('')}
                </div>
                <div class="info-column info-column-right">
                  ${rightRows.join('')}
                </div>`
          }
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
