// Re-export all functions from the refactored module
export {
  buildPlanificacionHTML,
  buildPlanificacionHTMLForPDF,
  exportToPDF,
  exportAllToPDF,
} from './exportPDF/index';

export type { Week, Day, DayInfo } from './exportPDF/index';
