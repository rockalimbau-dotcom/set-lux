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
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.productionLabel', 'Producción'))}</div>
          <div class="info-value">${esc(project?.productora || project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${esc(getTranslation('common.project', 'Proyecto'))}</div>
          <div class="info-value">${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))}</div>
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
      <span>${esc(getTranslation('footer.generatedBy', 'Generado automáticamente por'))}</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  `;
}

/**
 * Generate header title
 */
export function generateHeaderTitle(title: string | undefined): string {
  const baseTitle = getTranslation('reports.reports', 'Reportes');
  if (!title) {
    return esc(getTranslation('reports.week', 'Semana'));
  }
  if (title.includes('-')) {
    return `${esc(baseTitle)} - ${esc(getTranslation('planning.preproduction', 'Preproducción'))}`;
  }
  if (title.match(/\d+/)) {
    return `${esc(baseTitle)} - ${esc(getTranslation('planning.production', 'Producción'))}`;
  }
  return esc(getTranslation('reports.week', 'Semana'));
}

