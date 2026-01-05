// Re-export all functions from the refactored export module
// This maintains backward compatibility with existing imports
export {
  buildNecesidadesHTML,
  buildNecesidadesHTMLForPDF,
  exportToPDF,
  exportAllToPDF,
  renderExportHTML,
  renderExportAllHTML,
} from './export/index';

export type {
  DayInfo,
  DayValues,
  WeekEntry,
  NeedsData,
} from './export/index';
