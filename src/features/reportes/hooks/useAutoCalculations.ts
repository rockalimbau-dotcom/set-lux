// import removed
import { useEffect, useRef } from 'react';

import { diffMinutes, ceilHours } from '../utils/numbers';
import {
  calcHorasExtraMinutajeDesdeCorte,
  calcHorasExtraMinutajeConCortesia,
  formatHorasExtraDecimal,
  convertHorasExtraToNewFormat,
} from '../utils/runtime';

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
  horasExtraTipo?: string;
  currentData?: any; // Estado actual para preservar valores existentes
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
  horasExtraTipo = 'Hora Extra - Normal',
  currentData,
}: AutoCalculationsProps) {
  // Guardar el estado actual en un ref para preservarlo cuando cambia el tipo
  const dataRef = useRef(currentData);
  // Rastrear el tipo anterior para detectar cambios
  const prevHorasExtraTipoRef = useRef<string>(horasExtraTipo);
  const horasExtraTipoChangedRef = useRef<boolean>(false);
  
  // Actualizar el ref cuando cambia currentData
  useEffect(() => {
    dataRef.current = currentData;
  }, [currentData]);
  
  // Detectar cuando cambia horasExtraTipo
  useEffect(() => {
    const changed = prevHorasExtraTipoRef.current !== horasExtraTipo;
    if (changed) {
      horasExtraTipoChangedRef.current = true;
      prevHorasExtraTipoRef.current = horasExtraTipo;
    }
  }, [horasExtraTipo]);

  useEffect(() => {
    // Debug flag: habilita logs con ?debug=ta o localStorage.debug='ta'|'on'|'reportes'
    const debugEnabled = (() => {
      try {
        const w: any = (typeof window !== 'undefined') ? window : undefined;
        const qs = w ? new URLSearchParams(w.location.search).get('debug') || '' : '';
        const ls = w?.localStorage?.getItem('debug') || '';
        const val = String(qs || ls || '').toLowerCase();
        return val === 'ta' || val === 'on' || val === 'reportes';
      } catch {
        return false;
      }
    })();
    // Firma de dependencias para re-calcular cuando cambien horarios (start/end) de cualquier bloque en la semana actual
    // Nota: usamos findWeekAndDay/getBlockWindow para derivar una huella ligera de los horarios
    const planWindowsSignature = JSON.stringify((safeSemana as string[]).map((iso) => {
      const ctx = findWeekAndDay(iso) as WeekAndDay;
      const b = getBlockWindow(ctx?.day, 'base') || { start: null, end: null };
      const p = getBlockWindow(ctx?.day, 'pre') || { start: null, end: null };
      const k = getBlockWindow(ctx?.day, 'pick') || { start: null, end: null };
      return {
        iso,
        bS: b.start || '', bE: b.end || '',
        pS: p.start || '', pE: p.end || '',
        kS: k.start || '', kE: k.end || '',
      };
    }));
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
          // Heurística adicional: si el turno empieza a medianoche y termina por la mañana,
          // consideramos que finaliza al día siguiente (caso viernes 00:00-10:00 -> sábado 10:00)
          if (!crossed && prevStartDT) {
            const startH = prevStartDT.getHours();
            const endH = prevEndDT.getHours();
            if (startH === 0 && endH <= 12) crossed = true;
          }
          if (!prevStartDT) {
            const hh = Number(String(prevEndStr).split(':')[0] || '0');
            if (hh <= 6) crossed = true;
          }
          if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
          const gapMin = Math.max(0, Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000));
          // Debug TA Base
          try {
            if (debugEnabled) {
              // eslint-disable-next-line no-console
              console.debug('[TA.base]', { iso, prevISO, prevEndStr, start, gapMin, reqMin, ta: ceilHours(Math.max(0, reqMin - gapMin)) });
            }
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
          if (!crossed && prevStartDT) {
            const startH = prevStartDT.getHours();
            const endH = prevEndDT.getHours();
            if (startH === 0 && endH <= 12) crossed = true;
          }
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
          if (!crossed && prevStartDT) {
            const startH = prevStartDT.getHours();
            const endH = prevEndDT.getHours();
            if (startH === 0 && endH <= 12) crossed = true;
          }
          if (!prevStartDT) {
            const hh = Number(String(prevEndStr).split(':')[0] || '0');
            if (hh <= 6) crossed = true;
          }
          if (crossed) prevEndDT = new Date(prevEndDT.getTime() + 24 * 60 * 60 * 1000);
          const reqMin = Math.round((consecDesc >= 2 ? taF : taD) * 60);
          const gapMin = Math.max(0, Math.round((currStartDT.getTime() - prevEndDT.getTime()) / 60000));
          // Debug TA Recogida (solo si debugEnabled)
          try {
            if (debugEnabled) {
              // eslint-disable-next-line no-console
              console.debug('[TA.pick]', { iso, prevISO, prevEndStr, start, gapMin, reqMin, ta: ceilHours(Math.max(0, reqMin - gapMin)) });
            }
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
        let extras: number | string = 0;
        if (end) {
          const sDT = buildDateTime(iso, start);
          let eDT = buildDateTime(iso, end);
          if (sDT && eDT) {
            if (eDT <= sDT) eDT = new Date(eDT.getTime() + 24 * 60 * 60 * 1000);
            workedMin = Math.max(0, Math.round((eDT.getTime() - sDT.getTime()) / 60000));
          } else {
            workedMin = Number(diffMinutes(start, end) || 0);
          }
          // Calcular horas extra según el tipo seleccionado
          if (horasExtraTipo === 'Hora Extra - Minutaje desde corte') {
            const extraDecimal = calcHorasExtraMinutajeDesdeCorte(workedMin, baseHours);
            extras = extraDecimal > 0 ? formatHorasExtraDecimal(extraDecimal) : '';
          } else if (horasExtraTipo === 'Hora Extra - Minutaje + Cortesía') {
            const extraDecimal = calcHorasExtraMinutajeConCortesia(workedMin, baseHours, cortes);
            extras = extraDecimal > 0 ? formatHorasExtraDecimal(extraDecimal) : '';
          } else {
            // Hora Extra - Normal (comportamiento original)
            extras = calcHorasExtraMin(workedMin, baseHours, cortes);
          }
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
        try {
          if (debugEnabled) {
            // eslint-disable-next-line no-console
            console.debug('[noct.check]', { iso, block, start, end, noctIni: params.nocturnoIni, noctFin: params.nocturnoFin, noct });
          }
        } catch {}
        const noctStr = noct ? 'SI' : '';
        const extraStr = typeof extras === 'string' ? extras : (extras > 0 ? String(extras) : '');
        return {
          extra: extraStr,
          ta: taHours > 0 ? String(taHours) : '',
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
      // Usar prev como fuente principal porque tiene el estado más actualizado que React proporciona
      // prev es el estado actual antes de este update, que incluye todos los valores que el usuario ve
      const sourceState = prev;
      const next = { ...(sourceState || {}) };
      for (const p of safePersonas as Persona[]) {
        const pk = personaKey(p);
        const role = personaRole(p);
        const name = personaName(p);
        // Preservar la estructura completa incluyendo __manual__
        next[pk] = next[pk] ? { ...next[pk] } : {};
        // Asegurar que __manual__ existe y se preserva desde el estado fuente
        if (sourceState?.[pk]?.__manual__) {
          next[pk].__manual__ = { ...sourceState[pk].__manual__ };
        } else {
          next[pk].__manual__ = next[pk].__manual__ || {};
        }
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
            if (debugEnabled) {
              // eslint-disable-next-line no-console
              console.debug('[work.check]', { iso, rowBlock, role: role, name, workedThisBlock });
            }
          } catch {}
          const off = !workedThisBlock;
          const isBlockPersona = !!(p as any)?.__block; void isBlockPersona;
          try {
            if (debugEnabled && off) {
              // eslint-disable-next-line no-console
              console.debug('[noct.off]', { iso, rowBlock, role, name, reason: 'not scheduled on this block' });
            }
          } catch {}

          next[pk]['Horas extra'] = next[pk]['Horas extra'] || {};
          // CRÍTICO: Leer el valor del estado fuente (sourceState = prev) que es el estado actual
          // Esto asegura que tenemos el valor real que el usuario veía antes de cambiar el tipo
          const currExtra = sourceState?.[pk]?.['Horas extra']?.[iso];
          const autoExtra = auto.extra ?? '';
          // Verificar manualExtra usando el estado fuente
          const manualExtra = !!(sourceState?.[pk]?.__manual__?.['Horas extra']?.[iso]);
          
          // Debug temporal - siempre mostrar para debugging
          try {
            const convertedValue = currExtra && currExtra !== '' 
              ? convertHorasExtraToNewFormat(currExtra, horasExtraTipo)
              : '';
            // eslint-disable-next-line no-console
            console.log('[horasExtra.DEBUG]', JSON.stringify({
              iso,
              pk,
              currExtra: String(currExtra || ''),
              horasExtraTipo,
              autoExtra: String(autoExtra || ''),
              manualExtra,
              convertedValue: String(convertedValue || ''),
              horasExtraTipoChanged: horasExtraTipoChangedRef.current,
              shouldRecalculate: horasExtraTipoChangedRef.current && !manualExtra,
            }, null, 2));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[horasExtra.DEBUG] Error:', e);
          }
          
          if (off) {
            // Si no está trabajando en este bloque, vaciar
            next[pk]['Horas extra'][iso] = '';
            // También limpiar el flag manual
            if (next[pk].__manual__?.['Horas extra']?.[iso]) {
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
              delete next[pk].__manual__['Horas extra'][iso];
            }
          } else {
            // Lógica para preservar valores manuales o recalcular automáticos
            // CRÍTICO: Cuando cambia horasExtraTipo, SIEMPRE recalcular desde el horario
            // Solo preservar valores que fueron realmente editados manualmente por el usuario
            // (no valores que fueron calculados automáticamente y luego marcados como manuales)
            
            if (horasExtraTipoChangedRef.current) {
              // Cuando cambia el tipo, SIEMPRE recalcular desde el horario usando autoExtra
              // Esto asegura que los cálculos se hagan correctamente según el nuevo tipo
              next[pk]['Horas extra'][iso] = autoExtra;
              
              // Limpiar el flag manual cuando cambia el tipo para permitir recálculo automático
              // Solo mantener el flag si el usuario realmente editó el valor manualmente
              // (pero en este caso, siempre recalcular cuando cambia el tipo)
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
              // Eliminar el flag manual para permitir recálculo automático
              if (next[pk].__manual__['Horas extra'][iso]) {
                delete next[pk].__manual__['Horas extra'][iso];
              }
              
              if (debugEnabled) {
                try {
                  // eslint-disable-next-line no-console
                  console.debug('[horasExtra.recalculated.onTypeChange]', {
                    iso,
                    pk,
                    prevValue: currExtra,
                    newAutoValue: autoExtra,
                    horasExtraTipo,
                    prevHorasExtraTipo: prevHorasExtraTipoRef.current,
                  });
                } catch {}
              }
            } else if (manualExtra) {
              // Si el valor es MANUAL (el usuario lo editó) Y NO cambió el tipo, preservarlo y convertirlo al nuevo formato
              if (currExtra !== undefined && currExtra !== null && String(currExtra).trim() !== '') {
                const convertedValue = convertHorasExtraToNewFormat(currExtra, horasExtraTipo);
                const finalValue = convertedValue && convertedValue !== '' ? convertedValue : String(currExtra);
                
                if (debugEnabled) {
                  try {
                    // eslint-disable-next-line no-console
                    console.debug('[horasExtra.manual.converted]', {
                      iso,
                      pk,
                      original: currExtra,
                      converted: convertedValue,
                      final: finalValue,
                    });
                  } catch {}
                }
                
                next[pk]['Horas extra'][iso] = finalValue;
                // Preservar el flag manual
                next[pk].__manual__ = next[pk].__manual__ || {};
                next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
                next[pk].__manual__['Horas extra'][iso] = true;
              } else {
                // Si estaba marcado como manual pero ahora está vacío, preservar el vacío
                next[pk]['Horas extra'][iso] = '';
                next[pk].__manual__ = next[pk].__manual__ || {};
                next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
                next[pk].__manual__['Horas extra'][iso] = true;
              }
            } else {
              // Si el valor NO es manual Y NO cambió el tipo, usar el nuevo autoExtra
              // que ya está calculado correctamente según el horasExtraTipo actual
              next[pk]['Horas extra'][iso] = autoExtra;
              
              // Asegurar que NO está marcado como manual
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
              if (next[pk].__manual__['Horas extra'][iso]) {
                delete next[pk].__manual__['Horas extra'][iso];
              }
              
              if (debugEnabled) {
                try {
                  // eslint-disable-next-line no-console
                  console.debug('[horasExtra.auto.recalculated]', {
                    iso,
                    pk,
                    prevValue: currExtra,
                    newAutoValue: autoExtra,
                    horasExtraTipo,
                  });
                } catch {}
              }
            }
          }

          next[pk]['Turn Around'] = next[pk]['Turn Around'] || {};
          const currTA = next[pk]['Turn Around'][iso];
          const autoTA = auto.ta ?? '';
          const manualTA = !!next[pk]?.__manual__?.['Turn Around']?.[iso];
          next[pk]['Turn Around'][iso] = off
            ? ''
            : (manualTA ? currTA : (autoTA !== currTA ? autoTA : currTA));

          next[pk]['Nocturnidad'] = next[pk]['Nocturnidad'] || {};
          const currNoct = next[pk]['Nocturnidad'][iso];
          const autoNoct = auto.noct ?? '';
          const manualNoct = !!next[pk]?.__manual__?.['Nocturnidad']?.[iso];
          next[pk]['Nocturnidad'][iso] = off
            ? ''
            : (manualNoct ? currNoct : (autoNoct !== currNoct ? autoNoct : currNoct));
        }
      }
      try {
        const im: any = (import.meta as any);
        if (im && im.env && im.env.DEV) {
          (window as any).__reportesData = next;
        }
      } catch {}
      // Resetear el flag de cambio de tipo después de procesar todas las personas
      if (horasExtraTipoChangedRef.current) {
        horasExtraTipoChangedRef.current = false;
      }
      return next;
    });
  }, [
    JSON.stringify(safeSemana),
    JSON.stringify(params),
    JSON.stringify(safePersonas),
    horasExtraTipo,
    // Recalcular al cambiar cualquier start/end de la semana
    JSON.stringify((safeSemana as string[]).map((iso) => {
      const ctx = findWeekAndDay(iso) as WeekAndDay;
      const b = getBlockWindow(ctx?.day, 'base') || { start: null, end: null };
      const p = getBlockWindow(ctx?.day, 'pre') || { start: null, end: null };
      const k = getBlockWindow(ctx?.day, 'pick') || { start: null, end: null };
      return {
        iso,
        bS: b.start || '', bE: b.end || '',
        pS: p.start || '', pE: p.end || '',
        kS: k.start || '', kE: k.end || '',
      };
    })),
  ]);
}
