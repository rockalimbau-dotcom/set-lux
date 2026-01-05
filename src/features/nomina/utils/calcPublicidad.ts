// Re-export all functions from the refactored calcPublicidad module
// This maintains backward compatibility with existing imports
export {
  makeRolePrices,
  aggregateReports,
  aggregateWindowedReport,
  getCondParams,
  getOvertimeWindowForPayrollMonth,
  isoInRange,
} from './calcPublicidad/index';
