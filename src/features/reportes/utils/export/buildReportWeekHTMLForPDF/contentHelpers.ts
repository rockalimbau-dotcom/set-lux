import { esc } from '../htmlHelpers';
import { getTranslation } from '../translationHelpers';
import { isMeaningfulValue } from '../dataHelpers';
import { generatePersonHTML } from './personHTMLHelpers';
import { generateTeamBlockTitle } from './tableHelpers';

/**
 * Generate body HTML grouped by blocks
 */
export function generateBodyByBlocks(
  personsByBlock: { base: string[]; extra: string[]; pre: string[]; pick: string[] },
  safeSemanaWithData: string[],
  conceptosConDatos: string[],
  finalData: any,
  genderMap?: Record<string, string>
): string {
  const bodyParts: string[] = [];

  // Helper to filter persons with data
  const filterPersonsWithData = (personKeys: string[]): string[] => {
    return personKeys;
  };

  // Base team
  const basePersons = filterPersonsWithData(personsByBlock.base);
  if (basePersons.length > 0) {
    const baseTitle = generateTeamBlockTitle(
      getTranslation('payroll.teamBase', 'EQUIPO BASE'),
      safeSemanaWithData.length + 2,
      '#fff3e0',
      '#e65100'
    );
    bodyParts.push(baseTitle);
    bodyParts.push(...basePersons.map(pk => generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap)));
  }

  // Extra team
  const extraPersons = filterPersonsWithData(personsByBlock.extra);
  if (extraPersons.length > 0) {
    const extraTitle = generateTeamBlockTitle(
      getTranslation('payroll.teamExtra', 'EQUIPO EXTRA'),
      safeSemanaWithData.length + 2,
      '#fff3e0',
      '#e65100'
    );
    bodyParts.push(extraTitle);
    bodyParts.push(...extraPersons.map(pk => generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap)));
  }

  // Prelight team
  const prePersons = filterPersonsWithData(personsByBlock.pre);
  if (prePersons.length > 0) {
    const preTitle = generateTeamBlockTitle(
      getTranslation('payroll.teamPrelight', 'EQUIPO PRELIGHT'),
      safeSemanaWithData.length + 2,
      '#e3f2fd',
      '#1565c0'
    );
    bodyParts.push(preTitle);
    bodyParts.push(...prePersons.map(pk => generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap)));
  }

  // Pickup team
  const pickPersons = filterPersonsWithData(personsByBlock.pick);
  if (pickPersons.length > 0) {
    const pickTitle = generateTeamBlockTitle(
      getTranslation('payroll.teamPickup', 'EQUIPO RECOGIDA'),
      safeSemanaWithData.length + 2,
      '#e3f2fd',
      '#1565c0'
    );
    bodyParts.push(pickTitle);
    bodyParts.push(...pickPersons.map(pk => generatePersonHTML(pk, conceptosConDatos, safeSemanaWithData, finalData, genderMap)));
  }

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
  ].filter(Boolean);
  if (topRows.length % 2 === 1) {
    topRows.push(renderEmptyInfoRow('info-row-right'));
  }
  const secondaryLeftRows = [
    renderInfoRow(`${getTranslation('pdf.productionManager', 'Jefe de producción')}:`, (project as any)?.jefeProduccion, 'info-row'),
    renderInfoRow(`${getTranslation('pdf.transport', 'Transportes')}:`, (project as any)?.transportes, 'info-row'),
  ].filter(Boolean);
  const secondaryRightRows = [
    renderInfoRow(`${getTranslation('pdf.locations', 'Localizaciones')}:`, (project as any)?.localizaciones, 'info-row-right'),
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
