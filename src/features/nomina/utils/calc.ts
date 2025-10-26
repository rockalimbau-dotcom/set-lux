// Archivo principal que detecta el tipo de proyecto y delega a los archivos específicos

// Importar las funciones específicas de cada tipo
import { makeRolePrices as makeRolePricesSemanal, aggregateReports as aggregateReportsSemanal, getCondParams as getCondParamsSemanal, getOvertimeWindowForPayrollMonth as getOvertimeWindowForPayrollMonthSemanal, isoInRange as isoInRangeSemanal, aggregateWindowedReport as aggregateWindowedReportSemanal } from './calcSemanal';
import { makeRolePrices as makeRolePricesMensual, aggregateReports as aggregateReportsMensual, getCondParams as getCondParamsMensual, aggregateWindowedReport as aggregateWindowedReportMensual } from './calcMensual';
import { makeRolePrices as makeRolePricesPublicidad, aggregateReports as aggregateReportsPublicidad, getCondParams as getCondParamsPublicidad, aggregateWindowedReport as aggregateWindowedReportPublicidad } from './calcPublicidad';

// Función para detectar el tipo de proyecto
function getProjectType(project: any): 'semanal' | 'mensual' | 'publicidad' {
  const tipo = project?.conditions?.tipo || 'semanal';
  const tipoLower = String(tipo).toLowerCase();
  
  if (tipoLower === 'mensual') return 'mensual';
  if (tipoLower === 'publicidad') return 'publicidad';
  return 'semanal'; // default
}

// Función principal que delega según el tipo
export function makeRolePrices(project: any) {
  const projectType = getProjectType(project);
  
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.MAIN] makeRolePrices - project type:', projectType);
  }
  
  switch (projectType) {
    case 'mensual':
      return makeRolePricesMensual(project);
    case 'publicidad':
      return makeRolePricesPublicidad(project);
    case 'semanal':
    default:
      return makeRolePricesSemanal(project);
  }
}

// Funciones delegadas según el tipo de proyecto
export function aggregateReports(project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null = null) {
  const projectType = getProjectType(project);
  
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.MAIN] aggregateReports - project type:', projectType);
  }
  
  switch (projectType) {
    case 'mensual':
      return aggregateReportsMensual(project, weeks, filterISO);
    case 'publicidad':
      return aggregateReportsPublicidad(project, weeks, filterISO);
    case 'semanal':
    default:
      return aggregateReportsSemanal(project, weeks, filterISO);
  }
}

export function getCondParams(project: any) {
  const projectType = getProjectType(project);
  
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.MAIN] getCondParams - project type:', projectType);
  }
  
  switch (projectType) {
    case 'mensual':
      return getCondParamsMensual(project);
    case 'publicidad':
      return getCondParamsPublicidad(project);
    case 'semanal':
    default:
      return getCondParamsSemanal(project);
  }
}

export function getOvertimeWindowForPayrollMonth(project: any, monthKey: string) {
  const projectType = getProjectType(project);
  
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.MAIN] getOvertimeWindowForPayrollMonth - project type:', projectType);
  }
  
  switch (projectType) {
    case 'mensual':
      return getOvertimeWindowForPayrollMonthSemanal(project, monthKey);
    case 'publicidad':
      return getOvertimeWindowForPayrollMonthSemanal(project, monthKey); // Usar semanal como base (misma lógica)
    case 'semanal':
    default:
      return getOvertimeWindowForPayrollMonthSemanal(project, monthKey);
  }
}

export function isoInRange(iso: string, start: Date, end: Date) {
  // Esta función es común para todos los tipos
  return isoInRangeSemanal(iso, start, end);
}

export function aggregateWindowedReport(project: any, weeks: any[], filterISO: (iso: string) => boolean) {
  const projectType = getProjectType(project);
  
  if ((import.meta as any).env.DEV) {
    console.debug('[NOMINA.MAIN] aggregateWindowedReport - project type:', projectType);
  }
  
  switch (projectType) {
    case 'mensual':
      return aggregateWindowedReportMensual(project, weeks, filterISO);
    case 'publicidad':
      return aggregateWindowedReportPublicidad(project, weeks, filterISO);
    case 'semanal':
    default:
      return aggregateWindowedReportSemanal(project, weeks, filterISO);
  }
}