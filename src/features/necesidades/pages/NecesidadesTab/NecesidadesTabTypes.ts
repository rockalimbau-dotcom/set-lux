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

export interface NeedsWeek extends AnyRecord {
  id: string;
  label?: string;
  startDate?: string;
  days?: AnyRecord[];
  customRows?: AnyRecord[];
  open?: boolean;
}

export interface NeedsState {
  pre: NeedsWeek[];
  pro: NeedsWeek[];
}

