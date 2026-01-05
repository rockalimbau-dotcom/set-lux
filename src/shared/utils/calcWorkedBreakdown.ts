import { weekISOdays } from '@features/nomina/utils/plan';
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
  projectMode: 'semanal' | 'mensual' | 'publicidad' = 'semanal'
): WorkedBreakdownResult {
  const isWantedISO = filterISO || (() => true);
  const wantedRole = String(person.role || '');
  const wantedBase = wantedRole.replace(/[PR]$/, '');
  const wantedSuffix = /P$/.test(wantedRole)
    ? 'P'
    : /R$/.test(wantedRole)
    ? 'R'
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
      
      // Si encontramos "Fin", detener el conteo (no contar este día ni los siguientes)
      if ((day?.tipo || '') === 'Fin') {
        foundFin = true;
        break;
      }
      
      if ((day?.tipo || '') === 'Descanso') continue;

      // Verificar si la persona está trabajando en este día (en team, prelight o pickup)
      let isWorking = false;
      if (wantedRole === 'REF') {
        const anyRef = (arr: any[]) =>
          (arr || []).some((m: any) => nameEq(m?.name) && /ref/i.test(String(m?.role || '')));
        isWorking = anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup);
      } else {
        const list =
          wantedSuffix === 'P'
            ? day?.prelight
            : wantedSuffix === 'R'
            ? day?.pickup
            : day?.team;
        isWorking = (list || []).some((m: any) => {
          if (!nameEq(m?.name)) return false;
          const mBase = String(m?.role || '').replace(/[PR]$/, '');
          return !m?.role || !wantedBase || mBase === wantedBase;
        });
      }
      
      if (!isWorking) continue;
        
      // Contar por tipo de día según planificación
      const dayType = day?.tipo || '';
      
      // Lógica diferente según el modo del proyecto
      if (projectMode === 'publicidad') {
        // En publicidad: solo Rodaje y Oficina cuentan en workedDays
        if (dayType === 'Rodaje') {
          rodaje += 1;
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
      if (wantedSuffix === 'P') workedPre += 1;
      else if (wantedSuffix === 'R') workedPick += 1;
      else workedBase += 1;
    }
  }

  // Retornar según el modo del proyecto
  if (projectMode === 'publicidad') {
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
      descarga
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
      rodajeFestivo
    };
  }
}

