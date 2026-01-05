import { AnyRecord } from '@shared/types/common';

export interface NecesidadesTabProps {
  project?: AnyRecord;
  readOnly?: boolean;
}

export interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

export interface WeekEntry {
  wid: string;
  wk: AnyRecord;
}

