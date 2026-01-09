export type Project = { id?: string; nombre?: string };

export interface ReportesTabProps { 
  project?: Project; 
  mode?: 'semanal' | 'mensual' | 'diario';
  readOnly?: boolean;
}

