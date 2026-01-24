import { weekISOdays } from '@features/nomina/utils/plan';
import { hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';
import { norm, nameEq as nameEqUtil } from './normalize';

export interface WorkedBreakdownResult {
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
  prelight?: number;
  recogida?: number;
}

/**
 * Calcula el desglose de días trabajados para una persona en un conjunto de semanas.
 * 
 * @param weeks - Array de semanas de planificación
 * @param filterISO - Función para filtrar fechas ISO (retorna true si la fecha debe contarse)
 * @param person - Objeto con role y name de la persona
 * @param projectMode - Modo del proyecto: 'semanal' | 'mensual' | 'publicidad' (opcional, por defecto 'semanal')
 * @returns Objeto con el desglose de días trabajados
 */
export function calcWorkedBreakdown(
  weeks: any[],
  filterISO: (iso: string) => boolean,
  person: { role: string; name: string },
  projectMode: 'semanal' | 'mensual' | 'publicidad' | 'diario' = 'semanal'
): WorkedBreakdownResult {
  const isWantedISO = filterISO || (() => true);
  const wantedRole = String(person.role || '');
  const wantedBase = stripRoleSuffix(wantedRole);
  const wantedSuffix = hasRoleGroupSuffix(wantedRole)
    ? /P$/i.test(wantedRole)
      ? 'P'
      : 'R'
    : '';
  const wantedNameNorm = norm(person.name || '');

  let workedBase = 0;
  let workedPre = 0;
  let workedPick = 0;
  let workedDays = 0;
  let travelDays = 0;
  let holidayDays = 0;
  // Contadores por tipo de día
  let rodaje = 0;
  let oficina = 0;
  let travelDay = 0;
  let carga = 0;
  let descarga = 0;
  let localizar = 0;
  let rodajeFestivo = 0;
  let prelight = 0;
  let recogida = 0;

  const nameEq = (s: string) => nameEqUtil(s, person.name || '');

  // Flag para detener el conteo cuando se encuentre "Fin"
  let foundFin = false;

  for (const w of weeks) {
    if (foundFin) break; // Detener si ya encontramos "Fin"
    const isos = weekISOdays(w);
    for (let idx = 0; idx < (w.days || []).length; idx++) {
      if (foundFin) break; // Detener si ya encontramos "Fin"
      const day = (w.days || [])[idx];
      const iso = isos[idx];
      if (!isWantedISO(iso)) continue;
      
      // Si encontramos "Fin" en el día principal, detener el conteo (no contar este día ni los siguientes)
      if ((day?.tipo || '') === 'Fin') {
        foundFin = true;
        break;
      }
      
      // Verificar si la persona está trabajando en este día (en team, prelight o pickup)
      let isWorking = false;
      let activeSource: 'team' | 'prelight' | 'pickup' | null = null;
      // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), usar lógica de refuerzo
      if (wantedRole === 'REF' || (wantedRole && wantedRole.startsWith('REF') && wantedRole.length > 3)) {
        const anyRef = (arr: any[]) =>
          (arr || []).some((m: any) => {
            const role = String(m?.role || '');
            const isRefRole = role === 'REF' || (role.startsWith('REF') && role.length > 3) || /ref/i.test(role);
            return nameEq(m?.name) && isRefRole;
          });
        isWorking = anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup);
        if (isWorking) activeSource = 'team';
      } else {
        const matches = (list: any[]) =>
          (list || []).some((m: any) => {
            if (!nameEq(m?.name)) return false;
            const mBase = stripRoleSuffix(String(m?.role || ''));
            return !m?.role || !wantedBase || mBase === wantedBase;
          });

        const inTeam = matches(day?.team);
        const inPre = matches(day?.prelight);
        const inPick = matches(day?.pickup);

        if (wantedSuffix === 'P') {
          isWorking = inPre;
          activeSource = inPre ? 'prelight' : null;
        } else if (wantedSuffix === 'R') {
          isWorking = inPick;
          activeSource = inPick ? 'pickup' : null;
        } else {
          isWorking = inTeam || inPre || inPick;
          if (inTeam) activeSource = 'team';
          else if (inPre) activeSource = 'prelight';
          else if (inPick) activeSource = 'pickup';
        }
      }
      
      if (!isWorking) continue;

      // Determinar el tipo de jornada a usar (prelight/pickup específico o general)
      let dayTypeForSkip = day?.tipo || '';
      if (wantedSuffix === 'P' && day?.prelightTipo) {
        dayTypeForSkip = day.prelightTipo;
      } else if (wantedSuffix === 'R' && day?.pickupTipo) {
        dayTypeForSkip = day.pickupTipo;
      } else if (activeSource === 'prelight' && day?.prelightTipo) {
        dayTypeForSkip = day.prelightTipo;
      } else if (activeSource === 'pickup' && day?.pickupTipo) {
        dayTypeForSkip = day.pickupTipo;
      }
      
      // Saltar si es Descanso o Fin (usando el tipo específico si existe)
      if (dayTypeForSkip === 'Descanso' || dayTypeForSkip === 'Fin') continue;
        
      // Contar por tipo de día según planificación
      // Si es prelight o pickup, usar su tipo específico, sino usar el tipo del día principal
      let dayType = day?.tipo || '';
      if (wantedSuffix === 'P' && day?.prelightTipo) {
        dayType = day.prelightTipo;
      } else if (wantedSuffix === 'R' && day?.pickupTipo) {
        dayType = day.pickupTipo;
      } else if (activeSource === 'prelight' && day?.prelightTipo) {
        dayType = day.prelightTipo;
      } else if (activeSource === 'pickup' && day?.pickupTipo) {
        dayType = day.pickupTipo;
      }
      
      // Lógica diferente según el modo del proyecto
      if (projectMode === 'publicidad' || projectMode === 'diario') {
        // En publicidad: solo Rodaje y Oficina cuentan en workedDays
        if (dayType === 'Rodaje') {
          rodaje += 1;
          workedDays += 1;
        } else if (dayType === 'Prelight') {
          prelight += 1;
          // Prelight se cuenta como rodaje para los cálculos de precio, pero no en las píldoras
          // No sumar a rodaje aquí, se manejará en los cálculos de precio
          workedDays += 1;
        } else if (dayType === 'Recogida') {
          recogida += 1;
          // Recogida se cuenta como rodaje para los cálculos de precio, pero no en las píldoras
          // No sumar a rodaje aquí, se manejará en los cálculos de precio
          workedDays += 1;
        } else if (dayType === 'Oficina') {
          oficina += 1;
          workedDays += 1;
        } else if (dayType === 'Travel Day') {
          travelDays += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Carga') {
          carga += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Descarga') {
          descarga += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Localizar') {
          localizar += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Rodaje Festivo') {
          holidayDays += 1;
          // Rodaje Festivo no cuenta en workedDays (tiene su propia columna)
        }
      } else {
        // En semanal y mensual: todos los tipos cuentan en workedDays excepto Travel Day
        if (dayType === 'Rodaje') {
          rodaje += 1;
          workedDays += 1;
        } else if (dayType === 'Prelight') {
          prelight += 1;
          // Prelight se cuenta como rodaje para los cálculos de precio, pero no en las píldoras
          // No sumar a rodaje aquí, se manejará en los cálculos de precio
          workedDays += 1;
        } else if (dayType === 'Recogida') {
          recogida += 1;
          // Recogida se cuenta como rodaje para los cálculos de precio, pero no en las píldoras
          // No sumar a rodaje aquí, se manejará en los cálculos de precio
          workedDays += 1;
        } else if (dayType === 'Oficina') {
          oficina += 1;
          workedDays += 1;
        } else if (dayType === 'Travel Day') {
          travelDay += 1;
          travelDays += 1;
          // No contar en workedDays porque tiene su propia columna
        } else if (dayType === 'Carga') {
          carga += 1;
          workedDays += 1;
        } else if (dayType === 'Descarga') {
          descarga += 1;
          workedDays += 1;
        } else if (dayType === 'Localizar') {
          localizar += 1;
          workedDays += 1;
        } else if (dayType === 'Rodaje Festivo') {
          rodajeFestivo += 1;
          holidayDays += 1;
        }
      }
      
      // Mantener compatibilidad con código existente
      if (activeSource === 'prelight') workedPre += 1;
      else if (activeSource === 'pickup') workedPick += 1;
      else workedBase += 1;
    }
  }

  // Retornar según el modo del proyecto
  if (projectMode === 'publicidad' || projectMode === 'diario') {
    return { 
      workedDays, 
      travelDays, 
      workedBase, 
      workedPre, 
      workedPick, 
      holidayDays,
      rodaje,
      oficina,
      localizar,
      carga,
      descarga,
      prelight,
      recogida
    };
  } else {
    return { 
      workedDays, 
      travelDays, 
      workedBase, 
      workedPre, 
      workedPick, 
      holidayDays,
      rodaje,
      oficina,
      travelDay,
      carga,
      descarga,
      localizar,
      rodajeFestivo,
      prelight,
      recogida
    };
  }
}

