import { AnyRecord } from '@shared/types/common';

export type Project = { id?: string; nombre?: string };

export interface ReportesSemanaProps {
  project?: Project;
  title?: string;
  semana?: string[];
  personas?: AnyRecord[];
  mode?: 'semanal' | 'mensual' | 'diario';
  horasExtraTipo?: string;
  readOnly?: boolean;
  onExportWeekHTML?: () => void;
  onExportWeekPDF?: () => void;
  tutorialId?: string;
}

