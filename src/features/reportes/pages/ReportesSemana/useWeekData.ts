import { useMemo } from 'react';
import { mondayOf, toYYYYMMDD, defaultWeek } from '@shared/utils/date';
import { storage } from '@shared/services/localStorage.service';
import {
  collectWeekTeamWithSuffixFactory,
  buildSafePersonas,
  buildPeopleBase,
  buildPeoplePre,
  buildPeoplePick,
  buildPeopleExtra,
} from '../../utils/derive';
import { findWeekAndDayFactory } from '../../utils/plan';
import { AnyRecord } from '@shared/types/common';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';

export function useWeekData(
  project: { id?: string; nombre?: string } | undefined,
  semana: string[],
  providedPersonas: AnyRecord[]
) {
  const safeSemana = Array.isArray(semana) && semana.length === 7 ? semana : defaultWeek();

  const needsKey = useMemo(
    () => `needs_${project?.id || project?.nombre || 'demo'}`,
    [project?.id, project?.nombre]
  );

  const getPlanAllWeeks = () => {
    try {
      const obj = storage.getJSON<any>(needsKey);
      if (!obj) return { pre: [], pro: [] };
      return needsDataToPlanData(obj);
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
  }, [needsKey, JSON.stringify(safeSemana)]);

  const weekPickupActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
      );
    });
  }, [needsKey, JSON.stringify(safeSemana)]);

  const weekExtraActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        ((day.refList || []).length > 0 || day.refStart || day.refEnd)
      );
    });
  }, [needsKey, JSON.stringify(safeSemana)]);

  const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
    findWeekAndDay,
    [...safeSemana]
  );

  const prelightPeople = useMemo(
    () =>
      weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [],
    [weekPrelightActive, needsKey, JSON.stringify(safeSemana)]
  );

  const pickupPeople = useMemo(
    () => (weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : []),
    [weekPickupActive, needsKey, JSON.stringify(safeSemana)]
  );

  const extraPeople = useMemo(
    () => (weekExtraActive ? collectWeekTeamWithSuffix('refList', '') : []),
    [weekExtraActive, needsKey, JSON.stringify(safeSemana)]
  );

  // IMPORTANTE: Obtener basePeople directamente del plan, igual que prelight y pickup
  const basePeople = useMemo(
    () => collectWeekTeamWithSuffix('team', ''),
    [needsKey, JSON.stringify(safeSemana)]
  );

  const safePersonas = useMemo(
    () =>
      buildSafePersonas(
        providedPersonas,
        weekPrelightActive,
        prelightPeople,
        weekPickupActive,
        pickupPeople,
        weekExtraActive,
        extraPeople
      ),
    [
      JSON.stringify(providedPersonas),
      weekPrelightActive,
      weekPickupActive,
      weekExtraActive,
      JSON.stringify(prelightPeople),
      JSON.stringify(pickupPeople),
      JSON.stringify(extraPeople),
    ]
  );

  const peopleBase = useMemo(() => {
    // IMPORTANTE: NO usar refNamesBase porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros del equipo base, incluyendo refuerzos. Usar refNamesBase causaría duplicados.
    // Siempre pasar un Set vacío para refNamesBase
    const extrasKey = new Set(
      (extraPeople || []).map(m => `${String(m.role || '')}__${String(m.name || '')}`)
    );
    const cleanedBase = (basePeople || []).filter(m => {
      const key = `${String(m.role || '')}__${String(m.name || '')}`;
      return !extrasKey.has(key);
    });
    return buildPeopleBase(cleanedBase, new Set<string>());
  }, [
    JSON.stringify(basePeople),
    JSON.stringify(extraPeople),
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

  const peopleExtra = useMemo(() => {
    return buildPeopleExtra(extraPeople, new Set<string>());
  }, [JSON.stringify(extraPeople)]);

  return {
    safeSemana,
    findWeekAndDay,
    getPlanAllWeeks,
    weekPrelightActive,
    weekPickupActive,
    weekExtraActive,
    peopleBase,
    peoplePre,
    peoplePick,
    peopleExtra,
    safePersonas,
  };
}

