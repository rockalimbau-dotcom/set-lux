import { NeedsWeek } from '../../pages/NecesidadesTab/NecesidadesTabTypes';
import { ImportWeek } from '../types';
import { AnyRecord } from '@shared/types/common';
import i18n from '../../../../i18n/config';

const normalizeBaseRoster = (baseRoster?: AnyRecord[]) =>
  (baseRoster || [])
    .map(m => ({
      role: (m?.role || '').toUpperCase(),
      name: (m?.name || '').trim(),
      gender: m?.gender,
      source: 'base',
    }))
    .filter(m => m.role || m.name);

export function buildPreviewWeeks(weeks: ImportWeek[], baseRoster?: AnyRecord[], isPre = false): NeedsWeek[] {
  const sorted = [...weeks].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  return sorted.map((week, index) => {
    const weekNumber = isPre ? sorted.length - index : index + 1;
    const fallbackLabel = isPre
      ? i18n.t('planning.weekFormatNegative', { number: weekNumber })
      : i18n.t('planning.weekFormat', { number: weekNumber });
    const baseTeam = normalizeBaseRoster(baseRoster);
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const imported = week.days[idx];
      if (!imported) {
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
      const hasSchedule = Boolean(imported.crewStart) || Boolean(imported.crewEnd);
      const hasRodajeData =
        (imported.sequences && imported.sequences.length > 0) ||
        Boolean(imported.locationSequencesText) ||
        Boolean(imported.transportText) ||
        Boolean(imported.observationsText) ||
        hasSchedule ||
        Boolean(imported.precall);
      const fallbackTipo = hasRodajeData ? 'Rodaje' : 'Descanso';
      const crewTipo = hasSchedule ? (imported.crewTipo || fallbackTipo) : 'Descanso';
      const shouldIncludeCrew = String(crewTipo).toLowerCase() !== 'descanso';
      const noScheduleNotes = !hasSchedule
        ? [imported.locationSequencesText, imported.transportText, imported.observationsText]
            .filter(Boolean)
            .join('\n')
        : '';
      return {
        crewTipo,
        crewStart: hasSchedule ? imported.crewStart || '' : '',
        crewEnd: hasSchedule ? imported.crewEnd || '' : '',
        precall: hasSchedule ? imported.precall || '' : '',
        loc: hasSchedule ? imported.locationSequencesText || '' : '',
        seq: '',
        crewList: shouldIncludeCrew ? baseTeam : [],
        needTransport: hasSchedule ? imported.transportText || '' : '',
        obs: noScheduleNotes || imported.observationsText || '',
      };
    });

    return {
      id: `preview_${week.startDate}`,
      label: week.label || fallbackLabel,
      startDate: week.startDate,
      days,
      customRows: [],
      open: true,
    } as NeedsWeek;
  });
}
