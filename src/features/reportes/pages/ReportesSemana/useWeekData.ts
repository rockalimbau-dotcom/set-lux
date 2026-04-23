import { useCallback, useMemo } from 'react';
import { mondayOf, toYYYYMMDD, defaultWeek } from '@shared/utils/date';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
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
import { norm } from '../../utils/text';

const getMemberIdentityKey = (member: AnyRecord): string =>
  `${String(member?.personId || member?.roleId || member?.role || '').trim().toUpperCase()}__${String(member?.name || '').trim()}`;

const getPersonIdentityKey = (person: AnyRecord): string => {
  const name = norm(String(person?.name || person?.nombre || person?.label || '').trim());
  const personId = String(person?.personId || '').trim();
  return name ? `name:${name}` : `id:${personId}`;
};

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
  const [needsData] = useLocalStorage<any>(needsKey, { pre: [], pro: [] });

  const planAllWeeks = useMemo(() => {
    try {
      if (!needsData) return { pre: [], pro: [] };
      return needsDataToPlanData(needsData);
    } catch {
      return { pre: [], pro: [] };
    }
  }, [needsData]);

  const getPlanAllWeeks = useCallback(() => planAllWeeks, [planAllWeeks]);

  const safeSemanaKey = useMemo(() => JSON.stringify(safeSemana), [safeSemana]);

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
  }, [findWeekAndDay, safeSemanaKey]);

  const weekPickupActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        (getDayBlockList(day, BLOCKS.pick).length > 0 || day.pickupStart || day.pickupEnd)
      );
    });
  }, [findWeekAndDay, safeSemanaKey]);

  const weekExtraActive = useMemo(() => {
    return safeSemana.some(iso => {
      const { day } = findWeekAndDay(iso);
      return !!(
        day &&
        day.tipo !== 'Descanso' &&
        (getDayBlockList(day, BLOCKS.extra).length > 0 || hasExtraBlockContent(day) || day.refStart || day.refEnd)
      );
    });
  }, [findWeekAndDay, safeSemanaKey]);

  const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
    findWeekAndDay,
    [...safeSemana]
  );

  const prelightPeople = useMemo(
    () =>
      weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [],
    [collectWeekTeamWithSuffix, weekPrelightActive]
  );

  const pickupPeople = useMemo(
    () => (weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : []),
    [collectWeekTeamWithSuffix, weekPickupActive]
  );

  const extraPeople = useMemo(
    () => (weekExtraActive ? collectWeekTeamWithSuffix('refList', '') : []),
    [collectWeekTeamWithSuffix, weekExtraActive]
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
          const key = getPersonIdentityKey(member);
          if (!role && !name) return;
          if (seen.has(key)) return;
          seen.add(key);
          people.push({
            role,
            name,
            personId: member?.personId,
            gender: member?.gender,
            source: member?.source,
            roleId: member?.roleId,
            roleLabel: member?.roleLabel,
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
  }, [findWeekAndDay, safeSemana]);

  // IMPORTANTE: Obtener basePeople directamente del plan, igual que prelight y pickup
  const basePeople = useMemo(
    () => collectWeekTeamWithSuffix('team', ''),
    [collectWeekTeamWithSuffix]
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
    return buildPeopleBase(basePeople, new Set<string>());
  }, [
    JSON.stringify(basePeople),
  ]);

  const peoplePre = useMemo(() => {
    // IMPORTANTE: NO usar refNamesPre porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros de prelight, incluyendo refuerzos. Usar refNamesPre causaría duplicados.
    // Siempre pasar un Set vacío para refNamesPre
    const existingKeys = new Set((peopleBase || []).map(getPersonIdentityKey));
    const filteredPeople = (prelightPeople || []).filter(person => !existingKeys.has(getPersonIdentityKey(person)));
    return buildPeoplePre(weekPrelightActive, filteredPeople, new Set<string>());
  }, [
    weekPrelightActive,
    JSON.stringify(peopleBase),
    JSON.stringify(prelightPeople),
  ]);

  const peoplePick = useMemo(() => {
    // IMPORTANTE: NO usar refNamesPick porque collectWeekTeamWithSuffix ya procesa
    // TODOS los miembros de pickup, incluyendo refuerzos. Usar refNamesPick causaría duplicados.
    // Siempre pasar un Set vacío para refNamesPick
    const existingKeys = new Set([
      ...(peopleBase || []).map(getPersonIdentityKey),
      ...(peoplePre || []).map(getPersonIdentityKey),
    ]);
    const filteredPeople = (pickupPeople || []).filter(person => !existingKeys.has(getPersonIdentityKey(person)));
    return buildPeoplePick(weekPickupActive, filteredPeople, new Set<string>());
  }, [
    weekPickupActive,
    JSON.stringify(peopleBase),
    JSON.stringify(peoplePre),
    JSON.stringify(pickupPeople),
  ]);

  const peopleExtra = useMemo(() => {
    const existingKeys = new Set([
      ...(peopleBase || []).map(getPersonIdentityKey),
      ...(peoplePre || []).map(getPersonIdentityKey),
      ...(peoplePick || []).map(getPersonIdentityKey),
    ]);
    const filteredPeople = (extraPeople || []).filter(person => !existingKeys.has(getPersonIdentityKey(person)));
    return buildPeopleExtra(filteredPeople, new Set<string>());
  }, [
    JSON.stringify(peopleBase),
    JSON.stringify(peoplePre),
    JSON.stringify(peoplePick),
    JSON.stringify(extraPeople),
  ]);

  const visiblePersonKeys = useMemo(
    () => new Set([
      ...(peopleBase || []).map(getPersonIdentityKey),
      ...(peoplePre || []).map(getPersonIdentityKey),
      ...(peoplePick || []).map(getPersonIdentityKey),
    ]),
    [JSON.stringify(peopleBase), JSON.stringify(peoplePre), JSON.stringify(peoplePick)]
  );

  const visibleExtraGroups = useMemo(
    () =>
      extraGroups
        .map(group => ({
          ...group,
          people: group.people.filter(person => !visiblePersonKeys.has(getPersonIdentityKey(person))),
        }))
        .filter(group => group.people.length > 0),
    [JSON.stringify(extraGroups), visiblePersonKeys]
  );

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
    extraGroups: visibleExtraGroups,
    safePersonas,
  };
}
