export interface AutoCalculationsParams {
  jornadaTrabajo: number;
  jornadaComida: number;
  cortesiaMin: number;
  taDiario: number;
  taFinde: number;
  nocturnoIni: string;
  nocturnoFin: string;
}

export interface WeekAndDay {
  day: any;
}

export interface BlockWindow {
  start: string | null;
  end: string | null;
}

export interface PrevWorkingContext {
  prevEnd: string | null;
  prevStart: string | null;
  prevISO: string | null;
  consecDesc: number;
  weekendInGap: boolean;
}

export interface Persona {
  [key: string]: any;
}

import React from 'react';

export interface AutoCalculationsProps {
  enabled?: boolean;
  safeSemana: readonly string[];
  findWeekAndDay: (iso: string) => WeekAndDay | any;
  getBlockWindow: (day: any, block: string) => BlockWindow;
  /** iso opcional: evita depender de la identidad del objeto `day` para leer __schedule__ */
  getBlockWindowForPerson?: (person: Persona, day: any, block: string, iso?: string) => BlockWindow;
  /**
   * Misma fuente que la cabecera de horario (plan + __schedule__ + resolución de bloque).
   * Si está definida, el autocalculador usa esto en lugar de getBlockWindow/getBlockWindowForPerson para HE/noct/TA de entrada.
   */
  getScheduleWindowForReport?: (
    person: Persona,
    iso: string,
    rowBlock: string
  ) => { start: string; end: string };
  calcHorasExtraMin: (workedMin: number, baseHours: number, cortes: number) => number;
  buildDateTime: (iso: string, time: string) => Date | null;
  findPrevWorkingContext: (iso: string) => PrevWorkingContext;
  params: AutoCalculationsParams;
  safePersonas: readonly Persona[];
  personaKey: (persona: Persona) => string;
  personaRole: (persona: Persona) => string;
  personaName: (persona: Persona) => string;
  isPersonScheduledOnBlock: (
    iso: string,
    role: string,
    name: string,
    findWeekAndDay: (iso: string) => WeekAndDay | any,
    block?: string
  ) => boolean;
  getMaterialPropioConfig?: (
    role: string,
    name: string,
    block: 'base' | 'pre' | 'pick' | 'extra'
  ) => { value: number; type: 'semanal' | 'diario' } | null;
  setData: React.Dispatch<React.SetStateAction<any>>;
  horasExtraTipo?: string;
  currentData?: any;
}

export interface AutoResult {
  extra: string;
  ta: string;
  noct: string;
}

export interface AutoByDate {
  [iso: string]: {
    [block: string]: AutoResult;
  };
}
