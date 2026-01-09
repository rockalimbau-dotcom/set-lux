export interface Project {
  nombre?: string;
  produccion?: string;
  id?: string;
  [key: string]: any;
}

export interface BuildReportWeekHTMLParams {
  project?: Project;
  title?: string;
  safeSemana: string[];
  dayNameFromISO: (iso: string, index: number, dayNames?: string[]) => string;
  toDisplayDate: (iso: string) => string;
  horarioTexto: (iso: string) => string;
  CONCEPTS: string[];
  data: {
    [personaKey: string]: {
      [concepto: string]: {
        [fecha: string]: string;
      };
    };
  };
  personaKey?: (persona: any) => string;
  personaRole?: (persona: any) => string;
  personaName?: (persona: any) => string;
}

export interface BuildPdfParams extends BuildReportWeekHTMLParams {
  orientation?: 'landscape' | 'portrait';
  filename?: string;
}

export interface ExportReportRangeParams {
  project?: Project;
  title: string;
  safeSemana: string[];
  personas: any[];
  mode: 'semanal' | 'mensual' | 'diario';
  weekToSemanasISO: (week: any) => string[];
  weekToPersonas: (week: any) => any[];
  weeks: any[];
  horarioPrelight?: (iso: string) => string;
  horarioPickup?: (iso: string) => string;
}

