import { AnyRecord } from '@shared/types/common';
import { Project } from '../ReportesTabTypes';

export interface MonthReportGroupProps {
  monthKey: string;
  monthName: string;
  monthNameFull: string;
  weeks: AnyRecord[];
  allWeeksAvailable: AnyRecord[];
  project?: Project;
  mode: 'semanal' | 'mensual' | 'publicidad';
  weekToSemanasISO: (week: AnyRecord) => string[];
  weekToPersonas: (week: AnyRecord) => AnyRecord[];
  allMonthKeys: string[];
  readOnly?: boolean;
}

