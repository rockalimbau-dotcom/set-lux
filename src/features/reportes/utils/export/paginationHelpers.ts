import { isMeaningfulValue } from './dataHelpers';

const DEFAULT_PAGE_HEIGHT = 794;
const HEADER_AND_FOOTER_RESERVED = 230;
const PERSON_HEADER_HEIGHT = 36;
const CONCEPT_ROW_HEIGHT = 30;

function countVisibleConceptsForPerson(
  pk: string,
  concepts: string[],
  safeSemana: string[],
  data: any
): number {
  return concepts.filter(concept =>
    safeSemana.some(iso => isMeaningfulValue(data?.[pk]?.[concept]?.[iso]))
  ).length;
}

function estimatePersonHeight(
  pk: string,
  concepts: string[],
  safeSemana: string[],
  data: any
): number {
  const visibleConcepts = countVisibleConceptsForPerson(pk, concepts, safeSemana, data);
  return PERSON_HEADER_HEIGHT + Math.max(visibleConcepts, 0) * CONCEPT_ROW_HEIGHT;
}

export function paginatePersonKeysForPDF(
  personKeys: string[],
  concepts: string[],
  safeSemana: string[],
  data: any,
  maxPageHeight: number = DEFAULT_PAGE_HEIGHT
): string[][] {
  const effectiveHeight = maxPageHeight - HEADER_AND_FOOTER_RESERVED;
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentHeight = 0;

  personKeys.forEach(pk => {
    const personHeight = estimatePersonHeight(pk, concepts, safeSemana, data);
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

export const calculatePersonsPerPage = (
  totalPersons: number,
  concepts: string[],
  safeSemana: string[] = [],
  data: any = {}
): { personsPerPage: number; totalPages: number } => {
  const personKeys = Object.keys(data || {}).filter(key => !String(key).startsWith('__'));

  if (personKeys.length === 0) {
    const fallback = Math.max(1, Math.min(totalPersons || 1, 6));
    return { personsPerPage: fallback, totalPages: Math.ceil((totalPersons || 1) / fallback) };
  }

  const pages = paginatePersonKeysForPDF(personKeys, concepts, safeSemana, data);
  const personsPerPage = Math.max(...pages.map(page => page.length), 1);
  return { personsPerPage, totalPages: pages.length };
};
