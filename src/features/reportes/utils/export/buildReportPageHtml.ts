import { BuildPdfParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';

/** Construye el HTML de una página PDF con el subconjunto de personas indicado. */
export function buildReportPageHtml(
  pagePersonKeys: string[],
  params: Pick<
    BuildPdfParams,
    | 'project'
    | 'title'
    | 'safeSemana'
    | 'dayNameFromISO'
    | 'toDisplayDate'
    | 'horarioTexto'
    | 'jornadaTipoTexto'
    | 'jornadaTipoPersonaTexto'
    | 'horarioPersonaTexto'
    | 'resolvePersonaBlockKey'
    | 'horarioPrelight'
    | 'horarioPickup'
    | 'horarioExtraByBlock'
    | 'reportLabels'
    | 'groupedPersonKeys'
    | 'CONCEPTS'
    | 'adjustConceptsForExport'
    | 'data'
    | 'horasExtraTipo'
  >
): string {
  const { data, groupedPersonKeys } = params;
  const pageData: Record<string, unknown> = {};
  pagePersonKeys.forEach(pk => {
    pageData[pk] = data[pk];
  });
  if ((data as { __genderMap?: Record<string, string> })?.__genderMap) {
    pageData.__genderMap = (data as { __genderMap?: Record<string, string> }).__genderMap;
  }

  const pageGroupedPersonKeys = groupedPersonKeys
    ? {
        base: (groupedPersonKeys.base || []).filter(pk => pagePersonKeys.includes(pk)),
        pre: (groupedPersonKeys.pre || []).filter(pk => pagePersonKeys.includes(pk)),
        pick: (groupedPersonKeys.pick || []).filter(pk => pagePersonKeys.includes(pk)),
        extraGroups: (groupedPersonKeys.extraGroups || [])
          .map(group => ({
            blockKey: group.blockKey,
            people: group.people.filter(pk => pagePersonKeys.includes(pk)),
          }))
          .filter(group => group.people.length > 0),
      }
    : undefined;

  return buildReportWeekHTMLForPDF({
    ...params,
    groupedPersonKeys: pageGroupedPersonKeys,
    data: pageData,
  });
}
