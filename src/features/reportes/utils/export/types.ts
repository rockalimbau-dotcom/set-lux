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
  jornadaTipoTexto?: (iso: string, blockKey?: string) => string;
  jornadaTipoPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string;
  horarioPersonaTexto?: (pk: string, iso: string, blockKey?: string) => string;
  resolvePersonaBlockKey?: (pk: string, iso: string, blockKey?: string) => string;
  horarioPrelight?: (iso: string) => string;
  horarioPickup?: (iso: string) => string;
  horarioExtraByBlock?: (blockKey: string, iso: string) => string;
  reportLabels?: {
    base: string;
    extra: string;
    pre: string;
    pick: string;
  };
  groupedPersonKeys?: {
    base: string[];
    pre: string[];
    pick: string[];
    extraGroups: Array<{ blockKey: string; people: string[] }>;
  };
  CONCEPTS: string[];
  /**
   * Restringe qué conceptos puede mostrar la export por persona (p. ej. quitar «Material propio» si no está en condiciones).
   */
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[];
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
  /**
   * Tipo de cálculo/visualización de horas extra (p. ej. "Minutaje", "Minutaje + corte").
   * Se usa en export para formatear el total de "Horas extra" igual que en Reportes.
   */
  horasExtraTipo?: string;
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
  adjustConceptsForExport?: (personKey: string, baseConcepts: readonly string[]) => string[];
  horasExtraTipo?: string;
}
