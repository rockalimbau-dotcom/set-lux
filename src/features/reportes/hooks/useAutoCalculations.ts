import { useEffect, useRef } from 'react';
import {
  AutoCalculationsProps,
  AutoByDate,
  AutoResult,
  WeekAndDay,
  Persona,
} from './useAutoCalculations/useAutoCalculationsTypes';
import {
  isDebugEnabled,
  generatePlanWindowsSignature,
  normalizeParams,
  determineRowBlock,
  determineRoleForCheck,
} from './useAutoCalculations/useAutoCalculationsUtils';
import {
  computeBaseTurnAround,
  computePrelightTurnAround,
  computePickupTurnAround,
  computeExtraTurnAround,
} from './useAutoCalculations/turnAroundCalculations';
import { calculateHorasExtra } from './useAutoCalculations/horasExtraCalculations';
import { calculateNocturnidad } from './useAutoCalculations/nocturnidadCalculations';
import {
  preserveOrRecalculateHorasExtra,
  preserveOrUseAuto,
} from './useAutoCalculations/dataPreservation';

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
  getMaterialPropioConfig,
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
    const debugEnabled = isDebugEnabled();
    const { baseHours, cortes, taD, taF } = normalizeParams(params);
    const autoByDate: AutoByDate = {};

    // Calcular valores automáticos para cada día
    for (const iso of safeSemana as string[]) {
      const { day } = findWeekAndDay(iso) as WeekAndDay;

      const computeForBlock = (block: string): AutoResult => {
        const { start, end } = getBlockWindow(day, block);
        if (!start) return { extra: '', ta: '', noct: '' };

        // Calcular horas extra
        const extras = calculateHorasExtra({
          start,
          end,
          iso,
          baseHours,
          cortes,
          horasExtraTipo,
          calcHorasExtraMin,
          buildDateTime,
        });
        const extraStr = typeof extras === 'string' ? extras : extras > 0 ? String(extras) : '';

        // Calcular Turn Around según el bloque
        let taHours = 0;
        if (block === 'base') {
          taHours = computeBaseTurnAround(
            iso,
            start,
            findWeekAndDay,
            getBlockWindow,
            buildDateTime,
            findPrevWorkingContext,
            params,
            debugEnabled
          );
        } else if (block === 'pre') {
          taHours = computePrelightTurnAround(
            iso,
            start,
            findWeekAndDay,
            getBlockWindow,
            buildDateTime,
            findPrevWorkingContext,
            params
          );
        } else if (block === 'pick') {
          taHours = computePickupTurnAround(
            iso,
            start,
            findWeekAndDay,
            getBlockWindow,
            buildDateTime,
            findPrevWorkingContext,
            params,
            debugEnabled
          );
        } else if (block === 'extra') {
          taHours = computeExtraTurnAround(
            iso,
            start,
            findWeekAndDay,
            getBlockWindow,
            buildDateTime,
            findPrevWorkingContext,
            params,
            debugEnabled
          );
        }

        // Calcular nocturnidad
        const noct = end ? calculateNocturnidad(start, end, params) : false;
        const noctStr = noct ? 'SI' : '';

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
        extra: computeForBlock('extra'),
      };
    }

    // Aplicar los valores calculados preservando valores manuales
    setData((prev: any) => {
      const sourceState = prev;
      const next = { ...(sourceState || {}) };

      for (const p of safePersonas as Persona[]) {
        const pk = personaKey(p);
        const role = personaRole(p);
        const name = personaName(p);

        // Preservar la estructura completa incluyendo __manual__
        next[pk] = next[pk] ? { ...next[pk] } : {};
        if (sourceState?.[pk]?.__manual__) {
          next[pk].__manual__ = { ...sourceState[pk].__manual__ };
        } else {
          next[pk].__manual__ = next[pk].__manual__ || {};
        }

        for (const iso of safeSemana as string[]) {
          // Determinar el bloque de la fila
          const explicitBlock = ((p as any)?.__block as 'pre' | 'pick' | 'extra' | undefined) || undefined;
          const rowBlock = determineRowBlock(pk, explicitBlock);

          const auto = (autoByDate[iso] && (autoByDate[iso] as any)[rowBlock]) || {
            extra: '',
            ta: '',
            noct: '',
          };

          // Verificar si trabaja ese día en este bloque
          const roleForCheck = determineRoleForCheck(role, rowBlock);
          const workedThisBlock = isPersonScheduledOnBlock(
            iso,
            roleForCheck,
            name,
            findWeekAndDay as any,
            rowBlock
          );


          const off = !workedThisBlock;

          // Procesar Horas extra
          next[pk]['Horas extra'] = next[pk]['Horas extra'] || {};
          const currExtra = sourceState?.[pk]?.['Horas extra']?.[iso];
          const autoExtra = auto.extra ?? '';
          const manualExtra = !!(sourceState?.[pk]?.__manual__?.['Horas extra']?.[iso]);

          const horasExtraResult = preserveOrRecalculateHorasExtra({
            sourceState,
            pk,
            iso,
            autoExtra,
            currExtra,
            manualExtra,
            horasExtraTipo,
            horasExtraTipoChanged: horasExtraTipoChangedRef.current,
            off,
          });

          next[pk]['Horas extra'][iso] = horasExtraResult.value;
          if (off) {
            // Limpiar el flag manual si no está trabajando
            if (next[pk].__manual__?.['Horas extra']?.[iso]) {
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
              delete next[pk].__manual__['Horas extra'][iso];
            }
          } else {
            // Actualizar el flag manual
            next[pk].__manual__ = next[pk].__manual__ || {};
            next[pk].__manual__['Horas extra'] = next[pk].__manual__['Horas extra'] || {};
            if (horasExtraResult.isManual) {
              next[pk].__manual__['Horas extra'][iso] = true;
            } else {
              if (next[pk].__manual__['Horas extra'][iso]) {
                delete next[pk].__manual__['Horas extra'][iso];
              }
            }
          }

          // Procesar Turn Around
          next[pk]['Turn Around'] = next[pk]['Turn Around'] || {};
          const currTA = next[pk]['Turn Around'][iso];
          const autoTA = auto.ta ?? '';
          const manualTA = !!next[pk]?.__manual__?.['Turn Around']?.[iso];
          next[pk]['Turn Around'][iso] = preserveOrUseAuto({
            currValue: currTA,
            autoValue: autoTA,
            manual: manualTA,
            off,
          });

          // Procesar Nocturnidad
          next[pk]['Nocturnidad'] = next[pk]['Nocturnidad'] || {};
          const currNoct = next[pk]['Nocturnidad'][iso];
          const autoNoct = auto.noct ?? '';
          const manualNoct = !!next[pk]?.__manual__?.['Nocturnidad']?.[iso];
          next[pk]['Nocturnidad'][iso] = preserveOrUseAuto({
            currValue: currNoct,
            autoValue: autoNoct,
            manual: manualNoct,
            off,
          });
          if (!off && autoNoct === '') {
            next[pk]['Nocturnidad'][iso] = '';
            if (next[pk].__manual__?.['Nocturnidad']?.[iso]) {
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Nocturnidad'] = next[pk].__manual__['Nocturnidad'] || {};
              delete next[pk].__manual__['Nocturnidad'][iso];
            }
          }

          // Procesar Material propio (solo si aplica por rol)
          const materialConfig = getMaterialPropioConfig
            ? getMaterialPropioConfig(role, name, rowBlock as 'base' | 'pre' | 'pick' | 'extra')
            : null;
          if (materialConfig) {
            next[pk]['Material propio'] = next[pk]['Material propio'] || {};
            const currMaterial = next[pk]['Material propio'][iso];
            const manualMaterial = !!next[pk]?.__manual__?.['Material propio']?.[iso];
            const autoMaterial = materialConfig.type === 'semanal' ? 'Sí' : '';
            next[pk]['Material propio'][iso] = preserveOrUseAuto({
              currValue: currMaterial,
              autoValue: autoMaterial,
              manual: manualMaterial,
              off,
            });
            if (off && next[pk].__manual__?.['Material propio']?.[iso]) {
              next[pk].__manual__ = next[pk].__manual__ || {};
              next[pk].__manual__['Material propio'] = next[pk].__manual__['Material propio'] || {};
              delete next[pk].__manual__['Material propio'][iso];
            }
          }

          // Si no trabaja, limpiar valores manuales que no son auto-calculados
          if (off) {
            const clearConcept = (concepto: string) => {
              next[pk][concepto] = next[pk][concepto] || {};
              next[pk][concepto][iso] = '';
              if (next[pk].__manual__?.[concepto]?.[iso]) {
                next[pk].__manual__ = next[pk].__manual__ || {};
                next[pk].__manual__[concepto] = next[pk].__manual__[concepto] || {};
                delete next[pk].__manual__[concepto][iso];
              }
            };

            clearConcept('Kilometraje');
            clearConcept('Transporte');
            clearConcept('Penalty lunch');
            clearConcept('Dietas');
            clearConcept('Material propio');
          }
        }
      }

      // Debug en desarrollo
      try {
        const im: any = import.meta as any;
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
    generatePlanWindowsSignature(safeSemana, findWeekAndDay, getBlockWindow),
    getMaterialPropioConfig,
  ]);
}
