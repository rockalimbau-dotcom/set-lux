export interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

export interface Day {
  tipo?: string;
  start?: string;
  end?: string;
  cut?: string;
  loc?: string;
  team?: Array<{ role?: string; name?: string; source?: string }>;
  prelight?: Array<{ role?: string; name?: string; source?: string }>;
  pickup?: Array<{ role?: string; name?: string; source?: string }>;
  prelightStart?: string;
  prelightEnd?: string;
  pickupStart?: string;
  pickupEnd?: string;
  issue?: string;
  [key: string]: any;
}

export interface Week {
  label: string;
  startDate: string;
  days?: Day[];
  [key: string]: any;
}

