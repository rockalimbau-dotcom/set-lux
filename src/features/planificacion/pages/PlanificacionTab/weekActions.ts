import { parseYYYYMMDD } from '@shared/utils/date';
import { useTranslation } from 'react-i18next';
import { relabelWeekByCalendarDynamic } from '../../utils/calendar';
import {
  addPreWeekAction,
  addProWeekAction,
  duplicateWeekAction,
  rebaseWeeksAround,
  reorderWeeksAfterDelete,
} from '../../utils/weekActions';
import { sortByHierarchy } from '../../utils/sync';
import { AnyRecord } from '@shared/types/common';

export const createWeekHandlers = (
  preWeeks: AnyRecord[],
  proWeeks: AnyRecord[],
  setPreWeeks: (weeks: AnyRecord[] | ((prev: AnyRecord[]) => AnyRecord[])) => void,
  setProWeeks: (weeks: AnyRecord[] | ((prev: AnyRecord[]) => AnyRecord[])) => void,
  baseRoster: AnyRecord[],
  preRoster: AnyRecord[],
  pickRoster: AnyRecord[],
  holidayFull: Set<string>,
  holidayMD: Set<string>,
  readOnly: boolean,
  t: (key: string) => string
) => {
  const addPreWeek = async () => {
    if (readOnly) return;
    const next = addPreWeekAction(
      preWeeks as any,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    );
    const relabeledWeeks = await Promise.all(
      (next as AnyRecord[]).map(async w => relabelWeekByCalendarDynamic(w, w.startDate, holidayFull, holidayMD))
    );
    setPreWeeks(relabeledWeeks as any);
  };

  const addProWeek = async () => {
    if (readOnly) return;
    const next = addProWeekAction(
      preWeeks as any,
      proWeeks as any,
      baseRoster,
      preRoster,
      pickRoster,
      holidayFull,
      holidayMD
    );
    const relabeledWeeks = await Promise.all(
      (next as AnyRecord[]).map(async w => relabelWeekByCalendarDynamic(w, w.startDate, holidayFull, holidayMD))
    );
    setProWeeks(relabeledWeeks as any);
  };

  const duplicateWeek = (scope: 'pre' | 'pro', weekId: string) => {
    if (readOnly) return;
    if (scope === 'pre') {
      const next = duplicateWeekAction(
        preWeeks as any,
        weekId,
        -1,
        (n: number) => t('planning.weekFormatNegative', { number: n })
      ).sort((a: AnyRecord, b: AnyRecord) => parseYYYYMMDD(a.startDate).getTime() - parseYYYYMMDD(b.startDate).getTime());
      setPreWeeks(next as any);
    } else {
      const next = duplicateWeekAction(proWeeks as any, weekId, 1, (n: number) => t('planning.weekFormat', { number: n }));
      setProWeeks(next as any);
    }
  };

  const deleteWeek = async (scope: 'pre' | 'pro', weekId: string) => {
    if (readOnly) return;
    if (scope === 'pre') {
      setPreWeeks(prev => {
        const filtered = prev.filter((w: AnyRecord) => w.id !== weekId);
        // Reordenar y recalcular fechas después de eliminar
        const reordered = reorderWeeksAfterDelete(
          filtered as any,
          true, // isPre
          holidayFull,
          holidayMD
        );
        return reordered as any;
      });
    } else {
      setProWeeks(prev => {
        const filtered = prev.filter((w: AnyRecord) => w.id !== weekId);
        // Reordenar y recalcular fechas después de eliminar
        const reordered = reorderWeeksAfterDelete(
          filtered as any,
          false, // isPro
          holidayFull,
          holidayMD
        );
        return reordered as any;
      });
    }
  };

  const setWeekStart = (_scope: 'pre' | 'pro', weekId: string, newDateStr: string) => {
    if (readOnly) return;
    const raw = parseYYYYMMDD(newDateStr);
    const toMon = (date: Date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      return d;
    };
    const monday = toMon(raw);

    const { pre, pro } = rebaseWeeksAround(
      preWeeks as any,
      proWeeks as any,
      weekId,
      monday,
      holidayFull,
      holidayMD
    );
    setPreWeeks(pre as any);
    setProWeeks(pro as any);
  };

  const setDayField = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    patch: AnyRecord,
    t: (key: string) => string
  ) => {
    if (readOnly) return;
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const next: AnyRecord = { ...d, ...patch };
          if (Object.prototype.hasOwnProperty.call(patch, 'tipo')) {
            next.manualTipo = true;
          }
          const isShooting =
            patch.tipo &&
            [
              'Rodaje',
              'Travel Day',
              'Prelight',
              'Rodaje Festivo',
              'Carga',
              'Descarga',
              'Localizar',
            ].includes(patch.tipo);
          if (isShooting && (!d.team || d.team.length === 0)) {
            next.team = (baseRoster || []).map((m: AnyRecord) => ({
              role: m.role,
              name: m.name,
            }));
          }

          if (patch.tipo === 'Descanso') {
            next.team = [];
            next.prelight = [];
            next.pickup = [];
            next.start = '';
            next.end = '';
            next.cut = '';
            next.loc = t('planning.restLocation');
            next.prelightStart = '';
            next.prelightEnd = '';
            next.pickupStart = '';
            next.pickupEnd = '';
          }

          if (patch.tipo === 'Fin') {
            next.team = [];
            next.prelight = [];
            next.pickup = [];
            next.start = '';
            next.end = '';
            next.cut = '';
            next.loc = t('planning.endLocation');
            next.prelightStart = '';
            next.prelightEnd = '';
            next.pickupStart = '';
            next.pickupEnd = '';
          }

          // Si cambia a Oficina o Localizar, filtrar el equipo para dejar solo Gaffer (G) y Best Boy (BB)
          if (patch.tipo === 'Oficina' || patch.tipo === 'Localizar') {
            if (next.team && Array.isArray(next.team)) {
              next.team = next.team.filter((m: AnyRecord) => m.role === 'G' || m.role === 'BB');
            }
          }

          // Si cambia de Oficina o Localizar a Rodaje, Carga, Descarga, Travel Day, Prelight o Rodaje Festivo,
          // añadir los miembros del equipo base que faltan
          const wasOfficeOrLocation = d.tipo === 'Oficina' || d.tipo === 'Localizar';
          const needsFullTeam = patch.tipo &&
            ['Rodaje', 'Carga', 'Descarga', 'Travel Day', 'Prelight', 'Rodaje Festivo'].includes(patch.tipo);
          
          if (wasOfficeOrLocation && needsFullTeam && baseRoster && baseRoster.length > 0) {
            const currentTeam = next.team || [];
            const currentTeamKeys = new Set(
              currentTeam.map((m: AnyRecord) => `${m.role}::${m.name}`)
            );
            
            // Añadir miembros del equipo base que no estén ya en el equipo
            const missingMembers = baseRoster
              .filter((m: AnyRecord) => {
                const key = `${m.role}::${m.name}`;
                return !currentTeamKeys.has(key);
              })
              .map((m: AnyRecord) => ({
                role: m.role,
                name: m.name,
              }));
            
            next.team = [...currentTeam, ...missingMembers];
          }

          return next;
        });
        return { ...w, days };
      });

    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };

  const addMemberTo = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    member: AnyRecord
  ) => {
    if (readOnly) return;
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const cur = Array.isArray(d[listKey]) ? d[listKey] : [];

          if (
            member.name &&
            cur.some((t: AnyRecord) => t.role === member.role && t.name === member.name)
          ) {
            return d;
          }

          let nextList = [
            ...cur,
            {
              role: member.role,
              name: member.name,
              source:
                member.source ||
                (listKey === 'prelight'
                  ? 'pre'
                  : listKey === 'pickup'
                    ? 'pick'
                    : 'base'),
            },
          ];

          nextList = sortByHierarchy(nextList);

          return { ...d, [listKey]: nextList } as AnyRecord;
        });
        return { ...w, days };
      });
    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };

  const removeMemberFrom = (
    scope: 'pre' | 'pro',
    weekId: string,
    dayIdx: number,
    listKey: 'team' | 'prelight' | 'pickup',
    idxInList: number
  ) => {
    if (readOnly) return;
    const apply = (list: AnyRecord[]) =>
      list.map(w => {
        if (w.id !== weekId) return w;
        const days = w.days.map((d: AnyRecord, i: number) => {
          if (i !== dayIdx) return d;
          const cur = Array.isArray(d[listKey]) ? [...(d[listKey] as AnyRecord[])] : [];
          cur.splice(idxInList, 1);
          return { ...d, [listKey]: cur } as AnyRecord;
        });
        return { ...w, days };
      });
    if (scope === 'pre') setPreWeeks(ws => apply(ws));
    else setProWeeks(ws => apply(ws));
  };

  return {
    addPreWeek,
    addProWeek,
    duplicateWeek,
    deleteWeek,
    setWeekStart,
    setDayField,
    addMemberTo,
    removeMemberFrom,
  };
};

