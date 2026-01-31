export interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

export interface DayValues {
  loc?: string;
  seq?: string;
  tipo?: string;
  start?: string;
  end?: string;
  crewTipo?: string;
  crewStart?: string;
  crewEnd?: string;
  needTransport?: string;
  transportExtra?: string;
  needGroups?: string;
  needCranes?: string;
  needLight?: string;
  extraMat?: string;
  extraMatTime?: string;
  precall?: string;
  obs?: string;
  crewList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  crewTxt?: string;
  refList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  refTxt?: string;
  refTipo?: string;
  refStart?: string;
  refEnd?: string;
  preList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  preTxt?: string;
  preNote?: string;
  prelightTipo?: string;
  preStart?: string;
  preEnd?: string;
  pickList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  pickTxt?: string;
  pickNote?: string;
  pickupTipo?: string;
  pickStart?: string;
  pickEnd?: string;
  [key: string]: any;
}

export interface CustomRow {
  id: string;
  label: string;
  fieldKey: string;
}

export interface WeekEntry {
  id: string;
  label?: string;
  startDate?: string;
  customRows?: CustomRow[];
  [key: string]: any;
}

export interface NeedsData {
  pre: WeekEntry[];
  pro: WeekEntry[];
}

