// Re-export from the refactored ReportPersonRows module
// This maintains backward compatibility with existing imports
export { default } from './ReportPersonRows/ReportPersonRows';

export type {
  DietasCellProps,
  SiNoCellProps,
  ReportPersonRowsProps,
} from './ReportPersonRows/ReportPersonRowsTypes';
