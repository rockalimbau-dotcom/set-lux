export interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

export interface DayValues {
  loc?: string;
  seq?: string;
  needLoc?: string;
  needProd?: string;
  needLight?: string;
  extraMat?: string;
  precall?: string;
  obs?: string;
  crewList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  crewTxt?: string;
  preList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  preTxt?: string;
  pickList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  pickTxt?: string;
  [key: string]: any;
}

export interface WeekEntry {
  label?: string;
  startDate?: string;
  [key: string]: any;
}

export interface NeedsData {
  [weekId: string]: {
    days?: DayValues[];
    [key: string]: any;
  };
}

