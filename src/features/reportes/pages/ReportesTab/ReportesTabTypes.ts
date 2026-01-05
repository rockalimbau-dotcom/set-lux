export type Project = { id?: string; nombre?: string };

export interface ReportesTabProps { 
  project?: Project; 
  mode?: 'semanal' | 'mensual' | 'publicidad';
  readOnly?: boolean;
}

