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
}

export interface Persona {
  [key: string]: any;
}

import React from 'react';

export interface AutoCalculationsProps {
  safeSemana: readonly string[];
  findWeekAndDay: (iso: string) => WeekAndDay | any;
  getBlockWindow: (day: any, block: string) => BlockWindow;
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
    base: AutoResult;
    pre: AutoResult;
    pick: AutoResult;
    extra: AutoResult;
  };
}

