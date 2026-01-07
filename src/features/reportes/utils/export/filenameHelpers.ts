import i18n from '../../../../i18n/config';
import { Project } from './types';

/**
 * Helper to get translation for filename
 */
const getFilenameTranslation = (key: string, fallback: string): string => {
  const currentLang = i18n?.language || 'es';
  if (i18n?.store?.data?.[currentLang]?.translation) {
    const translations = i18n.store.data[currentLang].translation;
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        break;
      }
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return fallback;
};

/**
 * Generate filename for week export
 */
export const generateWeekFilename = (
  project: Project | undefined,
  title: string | undefined,
  filename?: string
): string => {
  if (filename) return filename;
  
  const projectName = project?.nombre || getFilenameTranslation('common.project', 'Proyecto');
  
  // Use direct translation for "Reportes" with fallback
  const currentLang = i18n?.language || 'es';
  let reportLabel = 'Reportes';
  if (i18n?.store?.data?.[currentLang]?.translation?.reports?.reports) {
    reportLabel = i18n.store.data[currentLang].translation.reports.reports;
  } else {
    if (currentLang === 'en') reportLabel = 'Reports';
    else if (currentLang === 'ca') reportLabel = 'Informes';
  }
  
  // Extract week number from title (e.g., "Semana 1", "Week 1", "Setmana 1")
  let weekNumber = '';
  if (title) {
    const weekMatch = title.match(/(?:Semana|Week|Setmana)\s*(-?\d+)/i);
    if (weekMatch) {
      weekNumber = weekMatch[1];
    }
  }
  const weekLabel = getFilenameTranslation('reports.week', 'Semana');
  const weekPart = weekNumber ? `${weekLabel}${weekNumber}` : (title || weekLabel);
  
  return `${reportLabel}_${weekPart.replace(/[^a-zA-Z0-9]/g, '_')}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
};

/**
 * Generate filename for range export
 */
export const generateRangeFilename = (
  project: Project | undefined,
  title: string,
  safeSemana: string[]
): string => {
  const projectName = project?.nombre || getFilenameTranslation('common.project', 'Proyecto');
  
  // Use direct translation for "Reportes" with fallback
  const currentLang = i18n?.language || 'es';
  let reportLabel = 'Reportes';
  if (i18n?.store?.data?.[currentLang]?.translation?.reports?.reports) {
    reportLabel = i18n.store.data[currentLang].translation.reports.reports;
  } else {
    if (currentLang === 'en') reportLabel = 'Reports';
    else if (currentLang === 'ca') reportLabel = 'Informes';
  }
  
  // Extract month from first date in safeSemana (only the month name, no "Mes" prefix)
  let monthPart = '';
  if (safeSemana && safeSemana.length > 0) {
    try {
      const firstDate = safeSemana[0];
      const [year, month, day] = firstDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const monthName = dateObj.toLocaleDateString(currentLang, { month: 'long' });
      const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      monthPart = monthCapitalized.replace(/[^a-zA-Z0-9]/g, '');
    } catch (e) {
      // If extraction fails, use title
      monthPart = title.replace(/[^a-zA-Z0-9]/g, '_');
    }
  } else {
    monthPart = title.replace(/[^a-zA-Z0-9]/g, '_');
  }
  
  return `${reportLabel}_${monthPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
};

