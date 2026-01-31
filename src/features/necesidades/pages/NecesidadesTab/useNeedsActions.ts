import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';
import i18n from '../../../../i18n/config';
import { parseYYYYMMDD, addDays, pad2 } from '@shared/utils/date';
import { mdKey } from '@shared/utils/dateKey';
import { relabelNeedsWeekByCalendar } from '../../utils/calendar';

interface UseNeedsActionsProps {
  storageKey: string;
  readOnly: boolean;
  setNeeds: (updater: (prev: AnyRecord) => AnyRecord) => void;
  baseRoster: AnyRecord[];
  holidayFull?: Set<string>;
  holidayMD?: Set<string>;
}

/**
 * Hook for needs actions (setCell, removeFromList, setWeekOpen)
 */
export function useNeedsActions({
  storageKey,
  readOnly,
  setNeeds,
  baseRoster,
  holidayFull = new Set(),
  holidayMD = new Set(),
}: UseNeedsActionsProps) {
  const { t } = useTranslation();

  const updateNeeds = useCallback((updater: (prev: AnyRecord) => AnyRecord) => {
    setNeeds((prev: AnyRecord) => {
      const next = updater(prev);
      storage.setJSON(storageKey, next);
      return next;
    });
  }, [setNeeds, storageKey]);

  const updateWeekById = useCallback((
    prev: AnyRecord,
    weekId: string,
    updater: (week: AnyRecord) => AnyRecord
  ) => {
    const updateList = (list: AnyRecord[] = []) =>
      list.map(week => (week?.id === weekId ? updater(week) : week));
    return {
      ...prev,
      pre: updateList(prev.pre || []),
      pro: updateList(prev.pro || []),
    };
  }, []);

  const nextStartForPro = useCallback((preWeeks: AnyRecord[] = [], proWeeks: AnyRecord[] = []) => {
    if (proWeeks.length > 0) {
      const last = proWeeks[proWeeks.length - 1];
      return addDays(parseYYYYMMDD(last.startDate as string), 7);
    }
    if (preWeeks.length > 0) {
      const sorted = [...preWeeks].sort(
        (a, b) => parseYYYYMMDD(a.startDate as string).getTime() - parseYYYYMMDD(b.startDate as string).getTime()
      );
      return addDays(parseYYYYMMDD(sorted[sorted.length - 1].startDate as string), 7);
    }
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, []);

  const nextStartForPre = useCallback((preWeeks: AnyRecord[] = [], proWeeks: AnyRecord[] = []) => {
    if (preWeeks.length > 0) {
      const sorted = [...preWeeks].sort(
        (a, b) => parseYYYYMMDD(a.startDate as string).getTime() - parseYYYYMMDD(b.startDate as string).getTime()
      );
      return addDays(parseYYYYMMDD(sorted[0].startDate as string), -7);
    }
    if (proWeeks.length > 0) {
      return addDays(parseYYYYMMDD(proWeeks[0].startDate as string), -7);
    }
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff - 7);
    return d;
  }, []);

  const toYYYYMMDD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isHolidayDate = (date: Date): boolean => {
    const ymd = toYYYYMMDD(date);
    const mmdd = mdKey(date.getMonth() + 1, date.getDate());
    const ddmm = `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}`;
    return holidayFull.has(ymd) || holidayMD.has(mmdd) || holidayMD.has(ddmm);
  };

  const relabelWeeks = useCallback((weeks: AnyRecord[], isPre: boolean) => {
    const sorted = [...weeks].sort((a, b) => {
      const timeA = parseYYYYMMDD(a.startDate as string).getTime();
      const timeB = parseYYYYMMDD(b.startDate as string).getTime();
      return timeA - timeB;
    });
    return sorted.map((week, index) => {
      const weekNumber = isPre ? sorted.length - index : index + 1;
      const label = isPre
        ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
        : i18n.t('planning.weekFormat', { number: weekNumber });
      return { ...week, label };
    });
  }, []);

  const toMonday = useCallback((date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, []);

  const rebaseWeeksAround = useCallback((
    preWeeks: AnyRecord[],
    proWeeks: AnyRecord[],
    weekId: string,
    monday: Date
  ) => {
    const all = [...preWeeks, ...proWeeks].sort(
      (a, b) => parseYYYYMMDD(a.startDate as string).getTime() - parseYYYYMMDD(b.startDate as string).getTime()
    );
    const anchorIdx = all.findIndex(w => w.id === weekId);
    if (anchorIdx === -1) return { pre: preWeeks, pro: proWeeks };
    const idToNewDate = new Map(
      all.map((w, i) => {
        const offsetWeeks = i - anchorIdx;
        const d = addDays(monday, offsetWeeks * 7);
        return [w.id, toYYYYMMDD(d)];
      })
    );
    const rebased = (list: AnyRecord[]) =>
      [...list]
        .map(w =>
          relabelNeedsWeekByCalendar(
            w,
            idToNewDate.get(w.id) || w.startDate,
            holidayFull,
            holidayMD
          )
        )
        .sort((a, b) => parseYYYYMMDD(a.startDate as string).getTime() - parseYYYYMMDD(b.startDate as string).getTime());
    return { pre: rebased(preWeeks), pro: rebased(proWeeks) };
  }, [holidayFull, holidayMD]);

  const reorderWeeksAfterDelete = useCallback((
    weeks: AnyRecord[],
    isPre: boolean
  ) => {
    if (weeks.length === 0) return weeks;
    const sorted = [...weeks].sort((a, b) => {
      const timeA = parseYYYYMMDD(a.startDate as string).getTime();
      const timeB = parseYYYYMMDD(b.startDate as string).getTime();
      return timeA - timeB;
    });
    if (sorted.length === 1) {
      const week = sorted[0];
      const label = isPre
        ? i18n.t('planning.weekFormatNegative', { number: 1 })
        : i18n.t('planning.weekFormat', { number: 1 });
      return [relabelNeedsWeekByCalendar({ ...week, label }, week.startDate, holidayFull, holidayMD)];
    }
    const firstWeekStart = parseYYYYMMDD(sorted[0].startDate as string);
    return sorted.map((week, index) => {
      const weekNumber = isPre ? sorted.length - index : index + 1;
      const label = isPre
        ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
        : i18n.t('planning.weekFormat', { number: weekNumber });
      const newStartDate = toYYYYMMDD(addDays(firstWeekStart, index * 7));
      return relabelNeedsWeekByCalendar(
        { ...week, label },
        newStartDate,
        holidayFull,
        holidayMD
      );
    });
  }, [holidayFull, holidayMD]);

  const addCustomRow = useCallback((weekId: string): string | null => {
    if (readOnly) return null;
    const newId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newRow = {
      id: newId,
      label: t('needs.customRowLabel'),
      fieldKey: `custom_${newId}`,
    };
    updateNeeds((prev: AnyRecord) =>
      updateWeekById(prev, weekId, (w: AnyRecord) => {
        const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
        customRows.push(newRow);
        return { ...w, customRows };
      })
    );
    return newId;
  }, [readOnly, t, updateNeeds, updateWeekById]);

  const updateCustomRowLabel = useCallback((weekId: string, rowId: string, label: string) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) =>
      updateWeekById(prev, weekId, (w: AnyRecord) => {
        const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
        const nextRows = customRows.map(row =>
          row?.id === rowId ? { ...row, label } : row
        );
        return { ...w, customRows: nextRows };
      })
    );
  }, [readOnly, updateNeeds, updateWeekById]);

  const removeCustomRow = useCallback((weekId: string, rowId: string) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) =>
      updateWeekById(prev, weekId, (w: AnyRecord) => {
        const customRows = Array.isArray(w.customRows) ? [...w.customRows] : [];
        const rowToRemove = customRows.find(row => row?.id === rowId);
        const nextRows = customRows.filter(row => row?.id !== rowId);
        const days = { ...(w.days || {}) } as AnyRecord;
        if (rowToRemove?.fieldKey) {
          for (let i = 0; i < 7; i++) {
            if (days[i]) {
              const day = { ...(days[i] as AnyRecord) };
              delete day[rowToRemove.fieldKey];
              days[i] = day;
            }
          }
        }
        return { ...w, days, customRows: nextRows };
      })
    );
  }, [readOnly, updateNeeds, updateWeekById]);

  const setCell = useCallback((weekId: string, dayIdx: number, fieldKey: string, value: unknown) => {
    if (readOnly) return;
    
    updateNeeds((prev: AnyRecord) =>
      updateWeekById(prev, weekId, (w: AnyRecord) => {
        const day: AnyRecord = (w.days && (w.days as AnyRecord[])[dayIdx]) || {};
        if (fieldKey === 'crewTipo') {
          const nextTipo = String(value || '').trim();
          const normalized = nextTipo.toLowerCase();
          const prevTipo = String(day?.crewTipo || '').trim();
          if (prevTipo === nextTipo) {
            return w;
          }
          const wasOfficeOrLocation = prevTipo === 'Oficina' || prevTipo === 'Localizar';
          const isOfficeOrLocation = nextTipo === 'Oficina' || nextTipo === 'Localizar';
          const needsFullTeam = [
            'Rodaje',
            'Pruebas de cámara',
            'Carga',
            'Descarga',
            'Travel Day',
            'Prelight',
            'Rodaje Festivo',
          ].includes(nextTipo);

          const nextDay: AnyRecord = {
            ...day,
            [fieldKey]: value,
          };

          if (normalized === 'descanso' || normalized === 'fin') {
            nextDay.crewList = [];
            nextDay.crewTxt = '';
            nextDay.crewStart = '';
            nextDay.crewEnd = '';
            return {
              ...w,
              days: { ...w.days, [dayIdx]: nextDay },
            };
          }

          if (isOfficeOrLocation) {
            if (Array.isArray(nextDay.crewList)) {
              nextDay.crewList = nextDay.crewList.filter(
                (m: AnyRecord) => m?.role === 'G' || m?.role === 'BB'
              );
            }
          }

          if (wasOfficeOrLocation && needsFullTeam && Array.isArray(baseRoster)) {
            const currentTeam = Array.isArray(nextDay.crewList) ? nextDay.crewList : [];
            const currentKeys = new Set(
              currentTeam.map((m: AnyRecord) => `${m?.role || ''}::${m?.name || ''}`)
            );
            const missingMembers = baseRoster
              .filter((m: AnyRecord) => {
                const key = `${m?.role || ''}::${m?.name || ''}`;
                return !currentKeys.has(key);
              })
              .map((m: AnyRecord) => ({
                role: m?.role,
                name: m?.name,
                gender: m?.gender,
              }));
            nextDay.crewList = [...currentTeam, ...missingMembers];
          }

          return {
            ...w,
            days: { ...w.days, [dayIdx]: nextDay },
          };
        }
        if (typeof value === 'string') {
          const prevValue = typeof day?.[fieldKey] === 'string' ? day[fieldKey] : (day?.[fieldKey] ?? '');
          if (String(prevValue) === value) {
            return w;
          }
        } else if (day?.[fieldKey] === value) {
          return w;
        }
        return {
          ...w,
          days: { ...w.days, [dayIdx]: { ...day, [fieldKey]: value } },
        };
      })
    );
  }, [readOnly, updateNeeds, updateWeekById]);

  const setWeekStart = useCallback((weekId: string, date: string) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) => {
      const preWeeks = Array.isArray(prev.pre) ? prev.pre : [];
      const proWeeks = Array.isArray(prev.pro) ? prev.pro : [];
      const monday = toMonday(parseYYYYMMDD(date));
      const rebased = rebaseWeeksAround(preWeeks, proWeeks, weekId, monday);
      return { ...prev, pre: rebased.pre, pro: rebased.pro };
    });
  }, [readOnly, updateNeeds, rebaseWeeksAround, toMonday]);

  const removeFromList = useCallback((weekId: string, dayIdx: number, listKey: string, idx: number) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) =>
      updateWeekById(prev, weekId, (w: AnyRecord) => {
        const day: AnyRecord = { ...(w.days?.[dayIdx] || {}) };
        const list = Array.isArray(day[listKey]) ? [...(day[listKey] as AnyRecord[])] : [];
        list.splice(idx, 1);
        day[listKey] = list;
        return {
          ...w,
          days: { ...w.days, [dayIdx]: day },
        };
      })
    );
  }, [readOnly, updateNeeds, updateWeekById]);

  const setWeekOpen = useCallback((weekId: string, isOpen: boolean) => {
    if (readOnly) return;
    try {
      updateNeeds((prev: AnyRecord) =>
        updateWeekById(prev, weekId, (w: AnyRecord) => ({ ...w, open: isOpen }))
      );
    } catch (error) {
      console.error('Error setting week open state:', error);
    }
  }, [readOnly, updateNeeds, updateWeekById]);

  const addWeek = useCallback((scope: 'pre' | 'pro') => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) => {
      const preWeeks = Array.isArray(prev.pre) ? prev.pre : [];
      const proWeeks = Array.isArray(prev.pro) ? prev.pro : [];
      const isPre = scope === 'pre';
      const weekNumber = (isPre ? preWeeks.length : proWeeks.length) + 1;
      const label = isPre
        ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
        : i18n.t('planning.weekFormat', { number: weekNumber });
      const startDate = isPre
        ? toYYYYMMDD(nextStartForPre(preWeeks, proWeeks))
        : toYYYYMMDD(nextStartForPro(preWeeks, proWeeks));
      const baseTeam = (baseRoster || []).map(m => ({
        role: (m?.role || '').toUpperCase(),
        name: (m?.name || '').trim(),
        gender: m?.gender,
      })).filter(m => m.role || m.name);
      const startDateObj = parseYYYYMMDD(startDate);
      const days = Array.from({ length: 7 }).map((_, idx) => {
        const dateObj = addDays(startDateObj, idx);
        const isWeekend = idx >= 5;
        const isHoliday = !isWeekend && isHolidayDate(dateObj);
        const crewTipo = isWeekend ? 'Descanso' : (isHoliday ? 'Rodaje Festivo' : 'Rodaje');
        return {
          crewList: isWeekend ? [] : baseTeam,
          crewTxt: '',
          crewTipo,
          crewStart: '',
          crewEnd: '',
        };
      });
      const week = {
        id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        label,
        startDate,
        days,
        customRows: [],
        open: true,
      };
      return {
        ...prev,
        pre: isPre ? relabelWeeks([...preWeeks, week], true) : preWeeks,
        pro: isPre ? proWeeks : relabelWeeks([...proWeeks, week], false),
      };
    });
  }, [readOnly, updateNeeds, relabelWeeks, nextStartForPre, nextStartForPro, baseRoster, holidayFull, holidayMD]);

  const duplicateWeek = useCallback((scope: 'pre' | 'pro', weekId: string) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) => {
      const list = scope === 'pre' ? (prev.pre || []) : (prev.pro || []);
      const other = scope === 'pre' ? (prev.pro || []) : (prev.pre || []);
      const w = list.find((wk: AnyRecord) => wk.id === weekId);
      if (!w) return prev;
      const dup = JSON.parse(JSON.stringify(w));
      dup.id = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      dup.startDate = toYYYYMMDD(addDays(parseYYYYMMDD(w.startDate as string), scope === 'pre' ? -7 : 7));
      const nextList = relabelWeeks([...list, dup], scope === 'pre');
      return scope === 'pre'
        ? { ...prev, pre: nextList, pro: other }
        : { ...prev, pro: nextList, pre: other };
    });
  }, [readOnly, updateNeeds, relabelWeeks]);

  const deleteWeek = useCallback((scope: 'pre' | 'pro', weekId: string) => {
    if (readOnly) return;
    updateNeeds((prev: AnyRecord) => {
      const list = scope === 'pre' ? (prev.pre || []) : (prev.pro || []);
      const other = scope === 'pre' ? (prev.pro || []) : (prev.pre || []);
      const filtered = list.filter((wk: AnyRecord) => wk.id !== weekId);
      const nextList = reorderWeeksAfterDelete(filtered, scope === 'pre');
      return scope === 'pre'
        ? { ...prev, pre: nextList, pro: other }
        : { ...prev, pro: nextList, pre: other };
    });
  }, [readOnly, updateNeeds, reorderWeeksAfterDelete]);

  const swapDays = useCallback((
    weekId1: string,
    dayIdx1: number,
    weekId2: string,
    dayIdx2: number
  ) => {
    if (readOnly) return;
    
    updateNeeds((prev: AnyRecord) => {
      const w1 = [...(prev.pre || []), ...(prev.pro || [])].find((w: AnyRecord) => w.id === weekId1) || { days: {} };
      const w2 = [...(prev.pre || []), ...(prev.pro || [])].find((w: AnyRecord) => w.id === weekId2) || { days: {} };

      const day1: AnyRecord = (w1.days && w1.days[dayIdx1]) || {};
      const day2: AnyRecord = (w2.days && w2.days[dayIdx2]) || {};

      const day1Copy = JSON.parse(JSON.stringify(day1));
      const day2Copy = JSON.parse(JSON.stringify(day2));

      const withFirst = updateWeekById(prev, weekId1, (w: AnyRecord) => ({
        ...w,
        days: { ...w.days, [dayIdx1]: day2Copy },
      }));
      const withSecond = updateWeekById(withFirst, weekId2, (w: AnyRecord) => ({
        ...w,
        days: { ...w.days, [dayIdx2]: day1Copy },
      }));
      return withSecond;
    });
  }, [readOnly, updateNeeds, updateWeekById]);

  return {
    setCell,
    setWeekStart,
    removeFromList,
    setWeekOpen,
    swapDays,
    addCustomRow,
    updateCustomRowLabel,
    removeCustomRow,
    addWeek,
    duplicateWeek,
    deleteWeek,
  };
}

