import { AnyRecord } from '@shared/types/common';
import i18n from '../../../../i18n/config';
import { ImportResult, ImportScope, ImportWeek, WeekDecision } from '../types';

const decisionKey = (scope: ImportScope, startDate: string) => `${scope}_${startDate}`;

const normalizeBaseRoster = (baseRoster?: AnyRecord[]) =>
  (baseRoster || [])
    .map(m => ({
      role: (m?.role || '').toUpperCase(),
      name: (m?.name || '').trim(),
      gender: m?.gender,
      source: 'base',
    }))
    .filter(m => m.role || m.name);

const buildDaysFromImport = (week: ImportWeek, existing?: AnyRecord, baseRoster?: AnyRecord[]) =>
  Array.from({ length: 7 }).map((_, idx) => {
    const importedDay = week.days[idx];
    if (!importedDay) {
      return {
        crewTipo: 'Descanso',
        crewStart: '',
        crewEnd: '',
        precall: '',
        loc: '',
        seq: '',
        crewList: [],
        needTransport: '',
        obs: '',
      };
    }
    const existingDay = Array.isArray(existing?.days) ? existing.days[idx] : {};
    const keepFestivo = String(existingDay?.crewTipo || '').toLowerCase() === 'rodaje festivo';
    const hasSchedule = Boolean(importedDay.crewStart) || Boolean(importedDay.crewEnd);
    const hasRodajeData =
      (importedDay.sequences && importedDay.sequences.length > 0) ||
      Boolean(importedDay.locationSequencesText) ||
      Boolean(importedDay.transportText) ||
      Boolean(importedDay.observationsText) ||
      hasSchedule ||
      Boolean(importedDay.precall);
    const fallbackTipo = hasRodajeData ? 'Rodaje' : 'Descanso';
    const crewTipo = keepFestivo
      ? existingDay?.crewTipo
      : (hasSchedule ? (importedDay.crewTipo || fallbackTipo) : 'Descanso');
    const normalizedBase = normalizeBaseRoster(baseRoster);
    const existingCrew = Array.isArray(existingDay?.crewList) ? existingDay.crewList : [];
    const shouldIncludeCrew = String(crewTipo || '').toLowerCase() !== 'descanso' && String(crewTipo || '').toLowerCase() !== 'fin';
    const noScheduleNotes = !hasSchedule
      ? [importedDay.locationSequencesText, importedDay.transportText, importedDay.observationsText]
          .filter(Boolean)
          .join('\n')
      : '';
    return {
      crewTipo,
      crewStart: hasSchedule ? importedDay.crewStart || '' : '',
      crewEnd: hasSchedule ? importedDay.crewEnd || '' : '',
      precall: hasSchedule ? importedDay.precall || '' : '',
      loc: hasSchedule ? importedDay.locationSequencesText || '' : '',
      seq: '',
      crewList: existingCrew.length ? existingCrew : (shouldIncludeCrew ? normalizedBase : []),
      needTransport: hasSchedule ? importedDay.transportText || '' : '',
      obs: noScheduleNotes || importedDay.observationsText || '',
    };
  });

const buildWeekFromImport = (week: ImportWeek, existing?: AnyRecord, baseRoster?: AnyRecord[]): AnyRecord => {
  const id = existing?.id || (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  return {
    id,
    label: week.label || existing?.label || '',
    startDate: week.startDate,
    days: buildDaysFromImport(week, existing, baseRoster),
    customRows: Array.isArray(existing?.customRows) ? existing.customRows : [],
    open: existing?.open ?? true,
  };
};

const relabelMissingWeekLabels = (weeks: AnyRecord[], isPre: boolean) => {
  const sorted = [...weeks].sort((a, b) => {
    const timeA = new Date(a.startDate as string).getTime();
    const timeB = new Date(b.startDate as string).getTime();
    return timeA - timeB;
  });
  return sorted.map((week, index) => {
    const weekNumber = isPre ? sorted.length - index : index + 1;
    const fallback = isPre
      ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
      : i18n.t('planning.weekFormat', { number: weekNumber });
    const label = String(week?.label || '').trim() ? week.label : fallback;
    return { ...week, label };
  });
};

export function applyImportToNeeds(
  prev: AnyRecord,
  importResult: ImportResult,
  decisions: Record<string, WeekDecision>,
  baseRoster?: AnyRecord[]
): AnyRecord {
  const preWeeks = Array.isArray(prev.pre) ? [...prev.pre] : [];
  const proWeeks = Array.isArray(prev.pro) ? [...prev.pro] : [];

  const applyToScope = (scope: ImportScope, list: AnyRecord[]) => {
    const byStart = new Map(list.map(week => [week.startDate, week]));
    const nextList = list.map(week => {
      const key = decisionKey(scope, week.startDate);
      const decision = decisions[key];
      if (decision !== 'overwrite') return week;
      const imported = importResult.weeks.find(w => w.scope === scope && w.startDate === week.startDate);
      if (!imported) return week;
      return buildWeekFromImport(imported, week, baseRoster);
    });

    importResult.weeks
      .filter(w => w.scope === scope)
      .forEach(importWeek => {
        const key = decisionKey(scope, importWeek.startDate);
        const decision = decisions[key] || 'import';
        if (decision === 'omit') return;
        if (byStart.has(importWeek.startDate)) return;
        nextList.push(buildWeekFromImport(importWeek, undefined, baseRoster));
      });

    return nextList;
  };

  const nextPre = applyToScope('pre', preWeeks);
  const nextPro = applyToScope('pro', proWeeks);

  return {
    ...prev,
    pre: relabelMissingWeekLabels(nextPre, true),
    pro: relabelMissingWeekLabels(nextPro, false),
  };
}
