import { useMemo } from 'react';
import { mondayOf, toYYYYMMDD, defaultWeek } from '@shared/utils/date';
import { storage } from '@shared/services/localStorage.service';
import {
  collectWeekTeamWithSuffixFactory,
  buildSafePersonas,
  buildPeopleBase,
  buildPeoplePre,
  buildPeoplePick,
  collectRefNamesForBlock,
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

  const refNamesBase = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'team'),
    [JSON.stringify(safeSemana), planKey]
  );
  const refNamesPre = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'prelight'),
    [JSON.stringify(safeSemana), planKey]
  );
  const refNamesPick = useMemo(
    () => collectRefNamesForBlock(safeSemana, findWeekAndDay, 'pickup'),
    [JSON.stringify(safeSemana), planKey]
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

  const peopleBase = useMemo(
    () => buildPeopleBase(providedPersonas, refNamesBase),
    [JSON.stringify(providedPersonas), JSON.stringify(refNamesBase)]
  );

  const peoplePre = useMemo(
    () => buildPeoplePre(weekPrelightActive, prelightPeople, refNamesPre),
    [
      weekPrelightActive,
      JSON.stringify(prelightPeople),
      JSON.stringify(refNamesPre),
    ]
  );

  const peoplePick = useMemo(
    () => buildPeoplePick(weekPickupActive, pickupPeople, refNamesPick),
    [
      weekPickupActive,
      JSON.stringify(pickupPeople),
      JSON.stringify(refNamesPick),
    ]
  );

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

