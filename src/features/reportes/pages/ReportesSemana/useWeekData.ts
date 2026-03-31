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
import { BLOCKS, findWeekAndDayFactory, getDayBlockList } from '../../utils/plan';
import { AnyRecord } from '@shared/types/common';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';
import { getExtraBlockCount, getExtraBlocks, hasExtraBlockContent } from '../../utils/extra';
import { personaKey } from '../../utils/model';

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
        (getDayBlockList(day, BLOCKS.pre).length > 0 ||
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
        (getDayBlockList(day, BLOCKS.pick).length > 0 || day.pickupStart || day.pickupEnd)
      );
    });
  }, [needsKey, JSON.stringify(safeSemana)]);

  const weekExtraActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        (getDayBlockList(day, BLOCKS.extra).length > 0 || hasExtraBlockContent(day) || day.refStart || day.refEnd)
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

  const extraGroups = useMemo(() => {
    const maxBlocks = safeSemana.reduce((max, iso) => {
      const { day } = findWeekAndDay(iso);
      return Math.max(max, getExtraBlockCount(day));
    }, 0);

    return Array.from({ length: maxBlocks }, (_, index) => {
      const seen = new Set<string>();
      const people: AnyRecord[] = [];

      safeSemana.forEach(iso => {
        const { day } = findWeekAndDay(iso);
        const block = getExtraBlocks(day)[index];
        const members = Array.isArray(block?.list) ? block.list : [];
        members.forEach((member: AnyRecord) => {
          const role = String(member?.role || '').trim().toUpperCase();
          const name = String(member?.name || '').trim();
          const key = `${role}__${name}`;
          if (!role && !name) return;
          if (seen.has(key)) return;
          seen.add(key);
          people.push({
            role,
            name,
            gender: member?.gender,
            source: member?.source,
            __block: `extra:${index}`,
          });
        });
      });

      return {
        index,
        blockKey: `extra:${index}`,
        people,
      };
    }).filter(group => group.people.length > 0);
  }, [safeSemana, needsKey]);

  // IMPORTANTE: Obtener basePeople directamente del plan, igual que prelight y pickup
  const basePeople = useMemo(
    () => collectWeekTeamWithSuffix('team', ''),
    [needsKey, JSON.stringify(safeSemana)]
  );

  const safePersonas = useMemo(() => {
    const baseSafe = buildSafePersonas(
      providedPersonas,
      weekPrelightActive,
      prelightPeople,
      weekPickupActive,
      pickupPeople,
      false,
      []
    );
    const merged = [...baseSafe];
    const seen = new Set(merged.map(personaKey));
    extraGroups.forEach(group => {
      group.people.forEach(person => {
        const key = personaKey(person);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(person);
        }
      });
    });
    return merged;
  }, [
    JSON.stringify(providedPersonas),
    weekPrelightActive,
    weekPickupActive,
    JSON.stringify(prelightPeople),
    JSON.stringify(pickupPeople),
    JSON.stringify(extraGroups),
  ]);

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
    extraGroups,
    safePersonas,
  };
}
