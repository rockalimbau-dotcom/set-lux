export type RolePrices = {
  getForRole: (roleCode: string, baseRoleCode?: string | null) => {
    jornada: number;
    travelDay: number;
    horaExtra: number;
    holidayDay: number;
    transporte: number;
    km: number;
    dietas: Record<string, number>;
    // Campos específicos de diario
    cargaDescarga?: number;
    localizacionTecnica?: number;
    factorHoraExtraFestiva?: number;
  };
};

export type RowIn = {
  role: string;
  name: string;
  gender?: 'male' | 'female' | 'neutral';
  extras: number;
  horasExtra: number;
  turnAround: number;
  nocturnidad: number;
  penaltyLunch: number;
  transporte: number;
  km: number;
  dietasCount: Map<string, number>;
  ticketTotal: number;
  otherTotal: number;
};

export type WindowOverride = Map<string, {
  extras?: number;
  horasExtra?: number;
  turnAround?: number;
  nocturnidad?: number;
  penaltyLunch?: number;
  transporte?: number;
  km?: number;
  dietasCount?: Map<string, number>;
  ticketTotal?: number;
  otherTotal?: number;
}>;

export interface MonthSectionProps {
  monthKey: string;
  rows: RowIn[];
  weeksForMonth: any[];
  filterISO: (iso: string) => boolean;
  rolePrices: RolePrices;
  projectMode?: 'semanal' | 'mensual' | 'diario';
  defaultOpen?: boolean;
  persistKeyBase: string;
  onExport?: (monthKey: string, enrichedRows: any[]) => void;
  onExportPDF?: (monthKey: string, enrichedRows: any[]) => void;
  windowOverrideMap?: WindowOverride | null;
  project?: any;
  aggregateFilteredConcepts?: (project: any, weeks: any[], filterISO: ((iso: string) => boolean) | null, dateFrom: string | null, dateTo: string | null) => Map<string, any> | null;
  allWeeks?: any[];
  buildRefuerzoIndex: (weeks: any[]) => Set<string>;
  stripPR: (r: string) => string;
  calcWorkedBreakdown: (
    weeks: any[],
    filterISO: (iso: string) => boolean,
    person: { role: string; name: string }
  ) => { 
    workedDays: number; 
    travelDays: number; 
    workedBase: number; 
    workedPre: number; 
    workedPick: number; 
    holidayDays: number;
    rodaje?: number;
    oficina?: number;
    travelDay?: number;
    carga?: number;
    descarga?: number;
    localizar?: number;
    rodajeFestivo?: number;
  };
  monthLabelEs: (key: string, withYear?: boolean) => string;
  ROLE_COLORS: Record<string, { bg: string; fg: string }>;
  roleLabelFromCode: (code: string) => string;
  readOnly?: boolean;
}

