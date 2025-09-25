import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { useEffect } from 'react';

import { diffMinutes, ceilHours } from '../utils/numbers';

interface AutoCalculationsParams {
  jornadaTrabajo: number;
  jornadaComida: number;
  cortesiaMin: number;
  taDiario: number;
  taFinde: number;
  nocturnoIni: string;
  nocturnoFin: string;
}

interface WeekAndDay {
  day: any;
}

interface BlockWindow {
  start: string | null;
  end: string | null;
}

interface PrevWorkingContext {
  prevEnd: string | null;
  prevStart: string | null;
  prevISO: string | null;
  consecDesc: number;
}

interface Persona {
  [key: string]: any;
}

interface AutoCalculationsProps {
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
  blockKeyForPerson: (iso: string, role: string, name: string, findWeekAndDay: (iso: string) => WeekAndDay | any) => string;
  isPersonScheduledOnBlock: (iso: string, role: string, name: string, findWeekAndDay: (iso: string) => WeekAndDay | any, block?: string) => boolean;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

interface AutoResult {
  extra: string;
  ta: string;
  noct: string;
}

interface AutoByDate {
  [iso: string]: {
    base: AutoResult;
    pre: AutoResult;
    pick: AutoResult;
  };
}

export default function useAutoCalculations({
  safeSemana,
  findWeekAndDay,
  getBlockWindow,
  calcHorasExtraMin,
  buildDateTime,
  findPrevWorkingContext,
  params,
  safePersonas,
  personaKey,
  personaRole,
  personaName,
  blockKeyForPerson,
  isPersonScheduledOnBlock,
  setData,
}: AutoCalculationsProps) {
  // Usar useLocalStorage para obtener datos de planificación
  const [planData] = useLocalStorage('plan_dummy', '');

  const planCalcKey = JSON.stringify({
    semana: safeSemana,
    plan: planData,
  });

  useEffect(() => {
    const autoByDate: AutoByDate = {};
    const {
      jornadaTrabajo,
      jornadaComida,
      cortesiaMin,
      taDiario,
      taFinde,
      nocturnoIni,
      nocturnoFin,
    } = params;

    const baseHours =
      (isFinite(jornadaTrabajo) ? jornadaTrabajo : 9) +
      (isFinite(jornadaComida) ? jornadaComida : 1);
    const cortes = isFinite(cortesiaMin) ? cortesiaMin : 15;
    const taD = isFinite(taDiario) ? taDiario : 12;
    const taF = isFinite(taFinde) ? taFinde : 48;

    for (const iso of safeSemana as string[]) {
      const { day } = findWeekAndDay(iso) as WeekAndDay;
      const computeForBlock = (block: string): AutoResult => {
        const { start, end } = getBlockWindow(day, block);
        if (!start || !end) return { extra: '', ta: '', noct: '' };
        const workedMin = diffMinutes(start, end);
        const extras = calcHorasExtraMin(workedMin, baseHours, cortes);
        const { prevEnd, prevStart, prevISO, consecDesc } =
          findPrevWorkingContext(iso);
        const taRequiredH = consecDesc >= 2 ? taF : taD;
        let taShortMin = 0;
        if (prevEnd && prevISO) {
          let prevEndDT = buildDateTime(prevISO, prevEnd);
          const prevStartDT = prevStart
            ? buildDateTime(prevISO, prevStart)
            : null;
          const currStartDT = buildDateTime(iso, start);
          if (prevEndDT && prevStartDT && prevEndDT <= prevStartDT) {
            prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          }
          if (prevEndDT && currStartDT) {
            const gapMin = Math.max(
              0,
              Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000)
            );
            const reqMin = Math.round(taRequiredH * 60);
            taShortMin = Math.max(0, reqMin - gapMin);
          }
        }
        const noct = (function hasNoct(startHHMM: string, endHHMM: string) {
          const [si, ei] = [startHHMM, endHHMM];
          const startM = (t: string) =>
            Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
          const iniMin = startM(si);
          const finMin = startM(ei);
          const thIni = startM(params.nocturnoIni || '22:00');
          const thFin = startM(params.nocturnoFin || '06:00');
          if (isNaN(iniMin) || isNaN(finMin)) return false;
          if (iniMin >= thIni || finMin >= thIni) return true;
          if (iniMin < thFin || finMin < thFin) return true;
          return false;
        })(start, end)
          ? 'SI'
          : '';
        return {
          extra: String(extras || 0),
          ta: String(ceilHours(taShortMin) || 0),
          noct,
        };
      };
      autoByDate[iso] = {
        base: computeForBlock('base'),
        pre: computeForBlock('pre'),
        pick: computeForBlock('pick'),
      };
    }

    setData((prev: any) => {
      const next = { ...(prev || {}) };
      for (const p of safePersonas as Persona[]) {
        const pk = personaKey(p);
        const role = personaRole(p);
        const name = personaName(p);
        next[pk] = next[pk] || {};
        for (const iso of safeSemana as string[]) {
          const blk = blockKeyForPerson(iso, role, name, findWeekAndDay as any);
          const auto = (autoByDate[iso] && (autoByDate[iso] as any)[blk]) || {
            extra: '',
            ta: '',
            noct: '',
          };
          const workedThisBlock = isPersonScheduledOnBlock(
            iso,
            role,
            name,
            findWeekAndDay as any,
            role === 'REF' ? blk : undefined
          );
          const off = !workedThisBlock;
          next[pk]['Horas extra'] = next[pk]['Horas extra'] || {};
          const currExtra = next[pk]['Horas extra'][iso];
          next[pk]['Horas extra'][iso] = off
            ? ''
            : currExtra === '' || currExtra == null
              ? (auto.extra ?? '')
              : currExtra;
          next[pk]['Turn Around'] = next[pk]['Turn Around'] || {};
          const currTA = next[pk]['Turn Around'][iso];
          next[pk]['Turn Around'][iso] = off
            ? ''
            : currTA === '' || currTA == null
              ? (auto.ta ?? '')
              : currTA;
          next[pk]['Nocturnidad'] = next[pk]['Nocturnidad'] || {};
          const currNoct = next[pk]['Nocturnidad'][iso];
          next[pk]['Nocturnidad'][iso] = off
            ? ''
            : currNoct === '' || currNoct == null
              ? (auto.noct ?? '')
              : currNoct;
        }
      }
      return next;
    });
  }, [
    JSON.stringify(safeSemana),
    JSON.stringify(params),
    JSON.stringify(safePersonas),
  ]);
}
