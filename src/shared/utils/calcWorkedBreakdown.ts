import { weekISOdays } from '@features/nomina/utils/plan';
import { hasRoleGroupSuffix, stripRoleSuffix } from '@shared/constants/roles';
import { norm, nameEq as nameEqUtil } from './normalize';
import { normalizeExtraBlocks } from './extraBlocks';

export interface WorkedBreakdownResult {
  workedDays: number;
  travelDays: number;
  workedBase: number;
  workedPre: number;
  workedPick: number;
  holidayDays: number;
  halfDays?: number;
  rodaje?: number;
  pruebasCamara?: number;
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
  person: { role: string; roleId?: string; personId?: string; name: string; source?: string },
  projectMode: 'semanal' | 'mensual' | 'publicidad' | 'diario' = 'semanal'
): WorkedBreakdownResult {
  const isWantedISO = filterISO || (() => true);
  const wantedRole = String(person.role || '');
  const wantedRoleId = String(person.roleId || '').trim();
  const wantedPersonId = String(person.personId || '').trim();
  const wantedBase = stripRoleSuffix(wantedRole);
  const wantedSuffix = hasRoleGroupSuffix(wantedRole)
    ? /P$/i.test(wantedRole)
      ? 'P'
      : 'R'
    : '';
  const wantedSource = String(person.source || '').trim().toLowerCase();
  const wantedNameNorm = norm(person.name || '');

  let workedBase = 0;
  let workedPre = 0;
  let workedPick = 0;
  let workedDays = 0;
  let travelDays = 0;
  let holidayDays = 0;
  let halfDays = 0;
  // Contadores por tipo de día
  let rodaje = 0;
  let pruebasCamara = 0;
  let oficina = 0;
  let travelDay = 0;
  let carga = 0;
  let descarga = 0;
  let localizar = 0;
  let rodajeFestivo = 0;
  let prelight = 0;
  let recogida = 0;

  const multiTariffIdentities = (() => {
    const identities = new Map<string, Set<string>>();
    const register = (member: any) => {
      const nameNorm = norm(member?.name || '');
      const personId = String(member?.personId || '').trim();
      const identity = personId || nameNorm;
      if (!identity) return;
      const roleIdentity = String(member?.roleId || stripRoleSuffix(String(member?.role || '')) || '').trim();
      if (!roleIdentity) return;
      if (!identities.has(identity)) identities.set(identity, new Set<string>());
      identities.get(identity)!.add(roleIdentity);
    };

    for (const week of weeks || []) {
      for (const day of week?.days || []) {
        (day?.team || []).forEach(register);
        (day?.prelight || []).forEach(register);
        (day?.pickup || []).forEach(register);
        normalizeExtraBlocks(day).forEach(block => {
          (block?.list || []).forEach(register);
        });
      }
    }

    return new Set(
      Array.from(identities.entries())
        .filter(([, roles]) => roles.size > 1)
        .map(([identity]) => identity)
    );
  })();

  const nameEq = (s: string) => nameEqUtil(s, person.name || '');

  const matchesScheduledMember = (member: any): boolean => {
    if (!nameEq(member?.name)) return false;

    const memberPersonId = String(member?.personId || '').trim();
    const memberRoleId = String(member?.roleId || '').trim();
    const memberBaseRole = stripRoleSuffix(String(member?.role || ''));
    const memberIdentity = memberPersonId || norm(member?.name || '');
    const isAmbiguousIdentity = multiTariffIdentities.has(memberIdentity);

    if (wantedRoleId) {
      if (memberRoleId) {
        if (memberRoleId !== wantedRoleId) return false;
        if (wantedPersonId && memberPersonId && memberPersonId !== wantedPersonId) return false;
        return true;
      }

      if (isAmbiguousIdentity) return false;
      if (wantedPersonId && memberPersonId && memberPersonId !== wantedPersonId) return false;
      return !member?.role || !wantedBase || memberBaseRole === wantedBase;
    }

    if (wantedPersonId) {
      if (memberPersonId) return memberPersonId === wantedPersonId;
      return !member?.role || !wantedBase || memberBaseRole === wantedBase;
    }

    return !member?.role || !wantedBase || memberBaseRole === wantedBase;
  };

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
      let matchedExtraType = '';
      
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
            if (!nameEq(m?.name) || !isRefRole) return false;
            return matchesScheduledMember(m);
          });
        isWorking = anyRef(day?.team) || anyRef(day?.prelight) || anyRef(day?.pickup);
        if (isWorking) activeSource = 'team';
      } else {
        const matches = (list: any[]) =>
          (list || []).some((m: any) => matchesScheduledMember(m));

        const extraBlocks = normalizeExtraBlocks(day);
        const matchingExtraBlocks = extraBlocks.filter(block =>
          (block?.list || []).some((m: any) => matchesScheduledMember(m))
        );

        const inTeam = (day?.team || []).some((m: any) => {
          if (String(m?.source || '').trim().toLowerCase() === 'ref') return false;
          return matchesScheduledMember(m);
        });
        const inPre = matches(day?.prelight);
        const inPick = matches(day?.pickup);
        const inExtra = matchingExtraBlocks.length > 0;
        matchedExtraType =
          String(matchingExtraBlocks[0]?.tipo || '').trim() ||
          String(day?.refTipo || '').trim();

        if (wantedSuffix === 'P') {
          isWorking = inPre;
          activeSource = inPre ? 'prelight' : null;
        } else if (wantedSuffix === 'R') {
          isWorking = inPick;
          activeSource = inPick ? 'pickup' : null;
        } else if (wantedSource === 'ref') {
          isWorking = inExtra;
          activeSource = inExtra ? 'extra' : null;
        } else if (wantedSource === 'base-strict') {
          isWorking = inTeam;
          activeSource = inTeam ? 'team' : null;
        } else {
          isWorking = inTeam || inPre || inPick || inExtra;
          if (inPre) activeSource = 'prelight';
          else if (inPick) activeSource = 'pickup';
          else if (inExtra && !inTeam) activeSource = 'extra';
          else if (inTeam) activeSource = 'team';
        }
      }
      
      if (!isWorking) continue;

      // Determinar el tipo de jornada a usar (prelight/pickup específico o general)
      let dayTypeForSkip = day?.tipo || '';
      if (wantedSuffix === 'P' && day?.prelightTipo) {
        dayTypeForSkip = day.prelightTipo;
      } else if (wantedSuffix === 'R' && day?.pickupTipo) {
        dayTypeForSkip = day.pickupTipo;
      } else if ((wantedSource === 'ref' || activeSource === 'extra') && matchedExtraType) {
        dayTypeForSkip = matchedExtraType;
      } else if (activeSource === 'prelight' && day?.prelightTipo) {
        dayTypeForSkip = day.prelightTipo;
      } else if (activeSource === 'pickup' && day?.pickupTipo) {
        dayTypeForSkip = day.pickupTipo;
      }
      
      // Si no hay tipo definido, no contar el día
      if (!dayTypeForSkip) continue;
      // Saltar si es Descanso o Fin (usando el tipo específico si existe)
      if (dayTypeForSkip === 'Descanso' || dayTypeForSkip === 'Fin') continue;
        
      // Contar por tipo de día según planificación
      // Si es prelight o pickup, usar su tipo específico, sino usar el tipo del día principal
      let dayType = day?.tipo || '';
      if (wantedSuffix === 'P' && day?.prelightTipo) {
        dayType = day.prelightTipo;
      } else if (wantedSuffix === 'R' && day?.pickupTipo) {
        dayType = day.pickupTipo;
      } else if ((wantedSource === 'ref' || activeSource === 'extra') && matchedExtraType) {
        dayType = matchedExtraType;
      } else if (activeSource === 'prelight' && day?.prelightTipo) {
        dayType = day.prelightTipo;
      } else if (activeSource === 'pickup' && day?.pickupTipo) {
        dayType = day.pickupTipo;
      }
      
      // Lógica diferente según el modo del proyecto
      if (projectMode === 'publicidad' || projectMode === 'diario') {
        // En publicidad: solo Rodaje y Oficina cuentan en workedDays
        if (dayType === '1/2 jornada') {
          halfDays += 1;
        } else if (dayType === 'Rodaje') {
          rodaje += 1;
          workedDays += 1;
        } else if (dayType === 'Pruebas de cámara') {
          pruebasCamara += 1;
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
        if (dayType === '1/2 jornada') {
          halfDays += 1;
        } else if (dayType === 'Rodaje') {
          rodaje += 1;
          workedDays += 1;
        } else if (dayType === 'Pruebas de cámara') {
          pruebasCamara += 1;
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
      halfDays,
      rodaje,
      pruebasCamara,
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
      halfDays,
      rodaje,
      pruebasCamara,
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
