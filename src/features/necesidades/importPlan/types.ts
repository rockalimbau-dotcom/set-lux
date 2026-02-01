export type ImportScope = 'pre' | 'pro';

export type WeekDecision = 'import' | 'overwrite' | 'omit';

export interface ImportSequence {
  id: string;
  label: string;
  location?: string;
}

export interface ImportDay {
  dateISO: string;
  weekStart: string;
  dayIndex: number;
  weekLabel?: string;
  sequences: ImportSequence[];
  locationSequencesText: string;
  transportText: string;
  observationsText: string;
  precall?: string;
  crewStart?: string;
  crewEnd?: string;
  crewTipo?: string;
}

export interface ImportWeek {
  startDate: string;
  label?: string;
  scope: ImportScope;
  days: Record<number, ImportDay>;
}

export interface ImportResult {
  weeks: ImportWeek[];
  warnings: string[];
}

export interface ImportConflict {
  key: string;
  scope: ImportScope;
  startDate: string;
  label?: string;
  existingWeekId: string;
}
