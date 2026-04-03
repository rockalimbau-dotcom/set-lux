import { AnyRecord } from '@shared/types/common';
import { NeedsRowLabels } from '../../utils/rowLabels';

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
  rowLabels?: NeedsRowLabels;
  open?: boolean;
}

export interface NeedsState {
  pre: NeedsWeek[];
  pro: NeedsWeek[];
}
