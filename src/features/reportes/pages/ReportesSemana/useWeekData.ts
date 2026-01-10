import { useMemo } from 'react';
import { mondayOf, toYYYYMMDD, defaultWeek } from '@shared/utils/date';
import { storage } from '@shared/services/localStorage.service';
import {
  collectWeekTeamWithSuffixFactory,
  buildSafePersonas,
  buildPeopleBase,
  buildPeoplePre,
  buildPeoplePick,
} from '../../utils/derive';
import { findWeekAndDayFactory } from '../../utils/plan';
import { AnyRecord } from '@shared/types/common';

export function useWeekData(
  project: { id?: string; nombre?: string } | undefined,
  semana: string[],
  providedPersonas: AnyRecord[]
) {
  const safeSemana = Array.isArray(semana) && semana.length === 7 ? semana : defaultWeek();

  const planKey = useMemo(
    () => `plan_${project?.id || project?.nombre || 'demo'}`,
    [project?.id, project?.nombre]
  );

  const getPlanAllWeeks = () => {
    try {
      const obj = storage.getJSON<any>(planKey);
      if (!obj) return { pre: [], pro: [] };
      return obj || { pre: [], pro: [] };
    } catch {
      return { pre: [], pro: [] };
    }
  };

  const findWeekAndDay = findWeekAndDayFactory(
    getPlanAllWeeks,
    mondayOf,
    toYYYYMMDD
  );

  const weekPrelightActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.prelight || []).length > 0 ||
          day.prelightStart ||
          day.prelightEnd)
      );
    });
  }, [planKey, JSON.stringify(safeSemana)]);

  const weekPickupActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
      );
    });
  }, [planKey, JSON.stringify(safeSemana)]);

  const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
    findWeekAndDay,
    [...safeSemana]
  );

  const prelightPeople = useMemo(
    () =>
      weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [],
    [weekPrelightActive, planKey, JSON.stringify(safeSemana)]
  );

  const pickupPeople = useMemo(
    () => (weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : []),
    [weekPickupActive, planKey, JSON.stringify(safeSemana)]
  );

  // IMPORTANTE: Obtener basePeople directamente del plan, igual que prelight y pickup
  const basePeople = useMemo(
    () => collectWeekTeamWithSuffix('team', ''),
    [planKey, JSON.stringify(safeSemana)]
  );

  const safePersonas = useMemo(
    () =>
      buildSafePersonas(
        providedPersonas,
        weekPrelightActive,
        prelightPeople,
        weekPickupActive,
        pickupPeople
      ),
    [
      JSON.stringify(providedPersonas),
      weekPrelightActive,
      weekPickupActive,
      JSON.stringify(prelightPeople),
      JSON.stringify(pickupPeople),
    ]
  );

  const peopleBase = useMemo(() => {
    // IMPORTANTE: NO usar refNamesBase porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros del equipo base, incluyendo refuerzos. Usar refNamesBase causaría duplicados.
    // Siempre pasar un Set vacío para refNamesBase
    return buildPeopleBase(basePeople, new Set<string>());
  }, [
    JSON.stringify(basePeople),
  ]);

  const peoplePre = useMemo(() => {
    // IMPORTANTE: NO usar refNamesPre porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros de prelight, incluyendo refuerzos. Usar refNamesPre causaría duplicados.
    // Siempre pasar un Set vacío para refNamesPre
    return buildPeoplePre(weekPrelightActive, prelightPeople, new Set<string>());
  }, [
    weekPrelightActive,
    JSON.stringify(prelightPeople),
  ]);

  const peoplePick = useMemo(() => {
    // IMPORTANTE: NO usar refNamesPick porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros de pickup, incluyendo refuerzos. Usar refNamesPick causaría duplicados.
    // Siempre pasar un Set vacío para refNamesPick
    return buildPeoplePick(weekPickupActive, pickupPeople, new Set<string>());
  }, [
    weekPickupActive,
    JSON.stringify(pickupPeople),
  ]);

  return {
    safeSemana,
    findWeekAndDay,
    getPlanAllWeeks,
    weekPrelightActive,
    weekPickupActive,
    peopleBase,
    peoplePre,
    peoplePick,
    safePersonas,
  };
}

