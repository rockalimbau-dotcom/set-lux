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
            <span class="info-value">${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))}</span>
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
      <span>Generado con</span>
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
  return 'REPORTES ELÉCTRICOS';
}
