// Export all functions from the refactored export module
export { buildNecesidadesHTML, buildNecesidadesHTMLForPDF } from './htmlBuilders';
export { exportToPDF } from './exportToPDF';
export { exportAllToPDF } from './exportAllToPDF';
export { renderExportHTML, renderExportAllHTML } from './legacy';

// Export types
export type { DayInfo, DayValues, WeekEntry, NeedsData } from './types';

