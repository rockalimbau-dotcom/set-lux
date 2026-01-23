import { BuildReportWeekHTMLParams } from './types';
import { deduplicateData, isMeaningfulValue } from './dataHelpers';
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
  // Debug removed to improve performance

  const genderMap = (data as any)?.__genderMap as Record<string, string> | undefined;

  // Deduplicate data
  const finalData = deduplicateData(data);

  // IMPORTANTE: Si data tiene bloques pre-agrupados (desde exportReportRangeToPDF),
  // usar esos bloques directamente para respetar la paginación por bloques
  let personsByBlock: { base: string[]; pre: string[]; pick: string[] };
  let finalPersonKeys: string[];
  
  if ((data as any).__blocks) {
    // Usar bloques pre-agrupados de la paginación
    personsByBlock = (data as any).__blocks;
    finalPersonKeys = [...personsByBlock.base, ...personsByBlock.pre, ...personsByBlock.pick];
    // Eliminar la propiedad especial del finalData para no afectar el procesamiento
    delete finalData.__blocks;
  } else {
    // Agrupar normalmente
    const grouped = groupAndSortPersonsByBlock(finalData);
    personsByBlock = grouped.personsByBlock;
    finalPersonKeys = grouped.finalPersonKeys;
  }


  const restLabel = getTranslation('reports.rest', 'DESCANSO');
  const safeSemanaWithData = safeSemana.filter(iso => {
    const dayLabel = horarioTexto(iso);
    if (dayLabel !== restLabel) return true;
    return Object.values(finalData || {}).some((person: any) =>
      isMeaningfulValue(person?.Dietas?.[iso])
    );
  });
  const conceptosConDatos = [...CONCEPTS];


  // Generate table headers
  const headDays = generateDaysHeader(safeSemanaWithData, dayNameFromISO, toDisplayDate);
  const headHorario = generateScheduleHeader(safeSemanaWithData, horarioTexto);

  // Generate body grouped by blocks
  const body = generateBodyByBlocks(personsByBlock, safeSemanaWithData, conceptosConDatos, finalData, genderMap);

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
