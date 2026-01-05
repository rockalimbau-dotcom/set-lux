import { BuildReportWeekHTMLParams } from './types';
import { deduplicateData, filterConceptsWithData, filterDaysWithData } from './dataHelpers';
import { esc } from './htmlHelpers';
import { getTranslation } from './translationHelpers';
import { groupAndSortPersonsByBlock } from './buildReportWeekHTMLForPDF/sortingHelpers';
import { generateDaysHeader, generateScheduleHeader } from './buildReportWeekHTMLForPDF/tableHelpers';
import { generateBodyByBlocks, generateInfoPanel, generateFooter, generateHeaderTitle } from './buildReportWeekHTMLForPDF/contentHelpers';
import { baseStyles } from './buildReportWeekHTMLForPDF/styles';

export function buildReportWeekHTMLForPDF({
  project,
  title,
  safeSemana,
  dayNameFromISO,
  toDisplayDate,
  horarioTexto,
  CONCEPTS,
  data,
}: Omit<BuildReportWeekHTMLParams, 'personaKey' | 'personaRole' | 'personaName'>): string {
  // Debug: log persona keys
  const personKeys = Object.keys(data || {});
  console.log('=== PDF EXPORT DEBUG ===');
  console.log('Persona keys in PDF export:', personKeys);

  // Deduplicate data
  const finalData = deduplicateData(data);

  // Group and sort persons by block
  const { personsByBlock, finalPersonKeys } = groupAndSortPersonsByBlock(finalData);

  console.log('📋 Sorted person keys by role hierarchy (PDF):', finalPersonKeys.map(k => {
    const [role] = String(k).split('__');
    return `${role}`;
  }));

  // Filter days that are not DESCANSO or have data
  const safeSemanaWithData = filterDaysWithData(
    safeSemana,
    horarioTexto,
    finalPersonKeys,
    CONCEPTS,
    finalData
  );

  // Filter concepts that have meaningful data
  const conceptosConDatos = filterConceptsWithData(
    CONCEPTS,
    finalPersonKeys,
    safeSemanaWithData,
    finalData
  );

  console.log('📊 Filtered concepts with data (PDF):', conceptosConDatos);

  // Generate table headers
  const headDays = generateDaysHeader(safeSemanaWithData, dayNameFromISO, toDisplayDate);
  const headHorario = generateScheduleHeader(safeSemanaWithData, horarioTexto);

  // Generate body grouped by blocks
  const body = generateBodyByBlocks(personsByBlock, safeSemanaWithData, conceptosConDatos, finalData);

  // Generate HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || getTranslation('common.project', 'Proyecto'))} – ${esc(title || getTranslation('reports.week', 'Semana'))}</title>
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  <div class="container-pdf">
    <div class="header">
      <h1>${generateHeaderTitle(title)}</h1>
    </div>
    <div class="content">
      ${generateInfoPanel(project)}
      <div class="week-title">${esc(title || getTranslation('reports.week', 'Semana'))}</div>
      <div class="table-container">
        <table>
          <thead>
            ${headDays}
            ${headHorario}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </div>
    ${generateFooter()}
  </div>
</body>
</html>`;

  return html;
}
