// import removed
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
  isPersonScheduledOnBlock,
  setData,
}: AutoCalculationsProps) {
  // no-op

  useEffect(() => {
    const autoByDate: AutoByDate = {};
    const { jornadaTrabajo, jornadaComida, cortesiaMin, taDiario, taFinde } = params;

    const baseHours =
      (isFinite(jornadaTrabajo) ? jornadaTrabajo : 9) +
      (isFinite(jornadaComida) ? jornadaComida : 1);
    const cortes = isFinite(cortesiaMin) ? cortesiaMin : 15;
    const taD = isFinite(taDiario) ? taDiario : 12;
    const taF = isFinite(taFinde) ? taFinde : 48;

    for (const iso of safeSemana as string[]) {
      const { day } = findWeekAndDay(iso) as WeekAndDay;
      // Busca el último ISO anterior que tenga horario para el bloque (aunque el día base sea Descanso)
      const prevISOForBlock = (currISO: string, block: 'base' | 'pre' | 'pick'): string | null => {
        try {
          const [y0, m0, d0] = String(currISO).split('-').map(Number);
          const start = new Date(y0, (m0 || 1) - 1, d0 || 1);
          for (let step = 1; step <= 14; step++) {
            const dt = new Date(start.getTime() - step * 24 * 60 * 60 * 1000);
            const isoStep = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            const ctx = findWeekAndDay(isoStep) as WeekAndDay;
            const bw = getBlockWindow(ctx?.day, block);
            if (bw?.end || bw?.start) return isoStep;
          }
        } catch {}
        return null;
      };
      // --- TA BASE ---
      const computeBaseTurnAround = (start: string | null): number => {
        if (!start) return 0;
        const { prevISO, consecDesc } = findPrevWorkingContext(iso);
        if (!prevISO) return 0;
        try {
          const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
          const prevBlk = getBlockWindow(prevCtx?.day, 'base');
          const prevEndStr = prevBlk?.end || null;
          const prevStartStr = prevBlk?.start || null;
          if (!prevEndStr) return 0;
          let prevEndDT = buildDateTime(prevISO, prevEndStr);
          const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
          const currStartDT = buildDateTime(iso, start);
          if (!prevEndDT || !currStartDT) return 0;
          let crossed = false;
          if (prevStartDT && prevEndDT <= prevStartDT) crossed = true;
          if (!prevStartDT) {
            const hh = Number(String(prevEndStr).split(':')[0] || '0');
            if (hh <= 6) crossed = true;
          }
          if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
          const gapMin = Math.max(0, Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000));
          // Debug TA Base
          try {
            // eslint-disable-next-line no-console
            console.debug('[TA.base]', { iso, prevISO, prevEndStr, start, gapMin, reqMin, ta: ceilHours(Math.max(0, reqMin - gapMin)) });
          } catch {}
          return ceilHours(Math.max(0, reqMin - gapMin));
        } catch {
          return 0;
        }
      };
      // --- TA PRELIGHT ---
      const computePrelightTurnAround = (start: string | null): number => {
        if (!start) return 0;
        const { consecDesc } = findPrevWorkingContext(iso);
        const prevISO = prevISOForBlock(iso, 'pre');
        if (!prevISO) return 0;
        try {
          const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
          const prevBlk = getBlockWindow(prevCtx?.day, 'pre');
          const prevEndStr = prevBlk?.end || null;
          const prevStartStr = prevBlk?.start || null;
          if (!prevEndStr) return 0;
          let prevEndDT = buildDateTime(prevISO, prevEndStr);
          const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
          const currStartDT = buildDateTime(iso, start);
          if (!prevEndDT || !currStartDT) return 0;
          let crossed = false;
          if (prevStartDT && prevEndDT <= prevStartDT) crossed = true;
          if (!prevStartDT) {
            const hh = Number(String(prevEndStr).split(':')[0] || '0');
            if (hh <= 6) crossed = true;
          }
          if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
          const gapMin = Math.max(0, Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000));
          return ceilHours(Math.max(0, reqMin - gapMin));
        } catch {
          return 0;
        }
      };
      // --- TA RECOGIDA ---
      const computePickupTurnAround = (start: string | null): number => {
        if (!start) return 0;
        const { consecDesc } = findPrevWorkingContext(iso);
        const prevISO = prevISOForBlock(iso, 'pick');
        if (!prevISO) return 0;
        try {
          const prevCtx = findWeekAndDay(prevISO) as WeekAndDay;
          const prevBlk = getBlockWindow(prevCtx?.day, 'pick');
          const prevEndStr = prevBlk?.end || null;
          const prevStartStr = prevBlk?.start || null;
          if (!prevEndStr) return 0;
          let prevEndDT = buildDateTime(prevISO, prevEndStr);
          const prevStartDT = prevStartStr ? buildDateTime(prevISO, prevStartStr) : null;
          const currStartDT = buildDateTime(iso, start);
          if (!prevEndDT || !currStartDT) return 0;
          let crossed = false;
          if (prevStartDT && prevEndDT <= prevStartDT) crossed = true;
          if (!prevStartDT) {
            const hh = Number(String(prevEndStr).split(':')[0] || '0');
            if (hh <= 6) crossed = true;
          }
          if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
          const gapMin = Math.max(0, Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000));
          // Debug TA Recogida (solo en dev, protegido)
          try {
            // eslint-disable-next-line no-console
            console.debug('[TA.pick]', { iso, prevISO, prevEndStr, start, gapMin, reqMin, ta: ceilHours(Math.max(0, reqMin - gapMin)) });
          } catch {}
          return ceilHours(Math.max(0, reqMin - gapMin));
        } catch {
          return 0;
        }
      };
      const computeForBlock = (block: string): AutoResult => {
        const { start, end } = getBlockWindow(day, block);
        if (!start) return { extra: '', ta: '', noct: '' };
        // Calcular duración solo si hay fin; TA se puede calcular sin fin del día actual
        let workedMin: number = 0;
        let extras = 0;
        if (end) {
          const sDT = buildDateTime(iso, start);
          let eDT = buildDateTime(iso, end);
          if (sDT && eDT) {
            if (eDT <= sDT) eDT = new Date(eDT.getTime() + 24 * 60 * 60 * 1000);
            workedMin = Math.max(0, Math.round((eDT.getTime() - sDT.getTime()) / 60000));
          } else {
            workedMin = Number(diffMinutes(start, end) || 0);
          }
          extras = calcHorasExtraMin(workedMin, baseHours, cortes);
        }
        // Usar helpers específicos por bloque para TA
        let taHours = 0;
        if (block === 'base') taHours = computeBaseTurnAround(start);
        else if (block === 'pre') taHours = computePrelightTurnAround(start);
        else if (block === 'pick') taHours = computePickupTurnAround(start);
        const noct = end ? ((function hasNoct(startHHMM: string, endHHMM: string) {
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
        })(start, end)) : false;
        const noctStr = noct ? 'SI' : '';
        return {
          extra: String(extras || 0),
          ta: String(taHours || 0),
          noct: noctStr,
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
          // Determinar el bloque de la fila: prioriza __block explícito del persona, si no, deriva de la clave
          const explicitBlock = ((p as any)?.__block as 'pre' | 'pick' | undefined) || undefined;
          const rowBlock: 'base' | 'pre' | 'pick' = explicitBlock
            ? explicitBlock
            : (/\.pre__/.test(pk) || /REF\.pre__/.test(pk)
                ? 'pre'
                : (/\.pick__/.test(pk) || /REF\.pick__/.test(pk) ? 'pick' : 'base'));
          const auto = (autoByDate[iso] && (autoByDate[iso] as any)[rowBlock]) || {
            extra: '',
            ta: '',
            noct: '',
          };
          // Para saber si trabaja ese día en este bloque: usar rol visual + bloque explícito
          const roleForCheck = role === 'REF'
            ? 'REF'
            : (rowBlock === 'pre' ? `${role}P` : (rowBlock === 'pick' ? `${role}R` : role));
          const workedThisBlock = isPersonScheduledOnBlock(
            iso,
            roleForCheck,
            name,
            findWeekAndDay as any,
            rowBlock
          );
          try {
            // eslint-disable-next-line no-console
            console.debug('[work.check]', { iso, rowBlock, role: role, name, workedThisBlock });
          } catch {}
          const off = !workedThisBlock;
          const isBlockPersona = !!(p as any)?.__block;

          next[pk]['Horas extra'] = next[pk]['Horas extra'] || {};
          const currExtra = next[pk]['Horas extra'][iso];
          const autoExtra = auto.extra ?? '';
          next[pk]['Horas extra'][iso] = off
            ? ''
            : (currExtra === '' || currExtra == null || (isBlockPersona && currExtra === '0' && autoExtra !== '0'))
              ? autoExtra
              : currExtra;

          next[pk]['Turn Around'] = next[pk]['Turn Around'] || {};
          const currTA = next[pk]['Turn Around'][iso];
          const autoTA = auto.ta ?? '';
          next[pk]['Turn Around'][iso] = off
            ? ''
            : (currTA === '' || currTA == null || currTA === '0' || (isBlockPersona && currTA === '0' && autoTA !== '0'))
              ? autoTA
              : currTA;

          next[pk]['Nocturnidad'] = next[pk]['Nocturnidad'] || {};
          const currNoct = next[pk]['Nocturnidad'][iso];
          const autoNoct = auto.noct ?? '';
          next[pk]['Nocturnidad'][iso] = off
            ? ''
            : (currNoct === '' || currNoct == null || (isBlockPersona && currNoct === '0' && autoNoct !== '0' && autoNoct !== ''))
              ? autoNoct
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
