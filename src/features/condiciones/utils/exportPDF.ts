// Re-export all functions from the refactored exportPDF module
// This maintains backward compatibility with existing imports
export {
  exportCondicionesToPDF,
  DEFAULT_CONDICIONES_EXPORT_SECTIONS,
} from './exportPDF/index';
export type { CondicionesExportSections } from './exportPDF/index';
