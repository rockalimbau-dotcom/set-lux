import { isMeaningfulValue } from './dataHelpers';
import {
  doesReportPageClip,
  measureReportPageHeight,
  PDF_PAGE_HEIGHT_PX,
  reportPageFits,
  reportPageLayoutOk,
} from './measureReportPageHeight';

export const PDF_PAGE_HEIGHT = PDF_PAGE_HEIGHT_PX;

const HEADER_AND_FOOTER_RESERVED = 280;
const PERSON_HEADER_HEIGHT = 40;
const CONCEPT_ROW_HEIGHT = 32;
const EXTRA_LINE_HEIGHT = 14;
const CHARS_PER_LINE = 26;
const SAFETY_BUFFER = 48;

function estimateLineCount(text: string): number {
  const len = String(text ?? '').trim().length;
  if (len === 0) return 1;
  return Math.ceil(len / CHARS_PER_LINE);
}

function maxCellLines(pk: string, concept: string, safeSemana: string[], data: any): number {
  let maxLines = 1;
  safeSemana.forEach(iso => {
    const val = data?.[pk]?.[concept]?.[iso];
    if (isMeaningfulValue(val)) {
      maxLines = Math.max(maxLines, estimateLineCount(String(val)));
    }
  });
  return maxLines;
}

function listVisibleConcepts(
  pk: string,
  concepts: string[],
  safeSemana: string[],
  data: any,
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[]
): string[] {
  const conceptsForPerson = adjustConceptsForExport
    ? adjustConceptsForExport(pk, concepts)
    : concepts;
  return conceptsForPerson.filter(concept =>
    safeSemana.some(iso => isMeaningfulValue(data?.[pk]?.[concept]?.[iso]))
  );
}

export function estimatePersonHeight(
  pk: string,
  concepts: string[],
  safeSemana: string[],
  data: any,
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[]
): number {
  const visibleConcepts = listVisibleConcepts(pk, concepts, safeSemana, data, adjustConceptsForExport);
  let conceptsHeight = 0;
  for (const concept of visibleConcepts) {
    const lines = maxCellLines(pk, concept, safeSemana, data);
    conceptsHeight += CONCEPT_ROW_HEIGHT + (lines - 1) * EXTRA_LINE_HEIGHT;
  }
  return PERSON_HEADER_HEIGHT + conceptsHeight;
}

export function paginatePersonKeysForPDF(
  personKeys: string[],
  concepts: string[],
  safeSemana: string[],
  data: any,
  maxPageHeight: number = PDF_PAGE_HEIGHT,
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[]
): string[][] {
  const effectiveHeight = maxPageHeight - HEADER_AND_FOOTER_RESERVED - SAFETY_BUFFER;
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentHeight = 0;

  personKeys.forEach(pk => {
    const personHeight = estimatePersonHeight(pk, concepts, safeSemana, data, adjustConceptsForExport);
    const nextHeight = currentHeight + personHeight;

    if (currentPage.length > 0 && nextHeight > effectiveHeight) {
      pages.push(currentPage);
      currentPage = [pk];
      currentHeight = personHeight;
      return;
    }

    currentPage.push(pk);
    currentHeight = nextHeight;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
}

/**
 * Pagina por trabajador midiendo el HTML real: si un bloque no cabe, pasa entero a la página siguiente.
 */
export async function paginatePersonKeysMeasured(
  personKeys: string[],
  buildPageHtml: (keys: string[]) => string,
  maxPageHeight: number = PDF_PAGE_HEIGHT
): Promise<string[][]> {
  if (personKeys.length === 0) return [[]];

  if (typeof document === 'undefined') {
    return [personKeys];
  }

  const pages: string[][] = [];
  let index = 0;

  while (index < personKeys.length) {
    const remaining = personKeys.slice(index);
    let fitCount = await findMaxPersonsThatFit(remaining, buildPageHtml, maxPageHeight);
    fitCount = Math.max(1, fitCount);

    while (fitCount > 1) {
      const trialHtml = buildPageHtml(remaining.slice(0, fitCount));
      if (await reportPageLayoutOk(trialHtml)) break;
      fitCount -= 1;
    }

    pages.push(remaining.slice(0, fitCount));
    index += fitCount;
  }

  return pages;
}

async function findMaxPersonsThatFit(
  remaining: string[],
  buildPageHtml: (keys: string[]) => string,
  maxPageHeight: number
): Promise<number> {
  let lo = 0;
  let hi = remaining.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const trialHtml = buildPageHtml(remaining.slice(0, mid));
    const height = await measureReportPageHeight(trialHtml);
    const fits =
      reportPageFits(height, maxPageHeight) && !(await doesReportPageClip(trialHtml));
    if (fits) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

export const calculatePersonsPerPage = (
  totalPersons: number,
  concepts: string[],
  safeSemana: string[] = [],
  data: any = {},
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[]
): { personsPerPage: number; totalPages: number } => {
  const personKeys = Object.keys(data || {}).filter(key => !String(key).startsWith('__'));

  if (personKeys.length === 0) {
    const fallback = Math.max(1, Math.min(totalPersons || 1, 6));
    return { personsPerPage: fallback, totalPages: Math.ceil((totalPersons || 1) / fallback) };
  }

  const pages = paginatePersonKeysForPDF(
    personKeys,
    concepts,
    safeSemana,
    data,
    PDF_PAGE_HEIGHT,
    adjustConceptsForExport
  );
  const personsPerPage = Math.max(...pages.map(page => page.length), 1);
  return { personsPerPage, totalPages: pages.length };
};
