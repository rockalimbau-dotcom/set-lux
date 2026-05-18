import { AnyRecord } from '@shared/types/common';
import { storage } from '@shared/services/localStorage.service';
import { getTranslation } from './translationHelpers';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';
import { getReportDayType } from '../dayTypePalette';
import { isPersonScheduledOnBlock } from '../plan';
import { parsePersonKey, resolveExportRoleMeta } from './dataHelpers';
import { resolvePersonBlockKey } from '../resolvePersonBlockKey';
import { buildPersonScheduleText } from '../personScheduleDisplay';
import { createHorarioHelpers } from '../../pages/ReportesSemana/horarioHelpers';

interface InitializeExportHelpersParams {
  project: any;
  findWeekAndDay: (iso: string) => any;
  horarioPrelight?: (iso: string) => string;
  horarioPickup?: (iso: string) => string;
}

interface InitializeExportHelpersReturn {
  translateJornadaType: (tipo: string) => string;
  horarioTexto: (iso: string) => string;
  jornadaTipoTexto: (iso: string, blockKey?: string) => string;
  jornadaTipoPersonaTexto: (pk: string, iso: string, blockKey?: string) => string;
  resolvePersonaBlockKey: (pk: string, iso: string, blockKey?: string) => string;
  horarioPersonaTexto: (pk: string, iso: string, blockKey?: string) => string;
  horarioPrelightFn: (iso: string) => string;
  horarioPickupFn: (iso: string) => string;
  horarioExtraByBlock: (blockKey: string, iso: string) => string;
  bindWeekReportData: (data: AnyRecord) => void;
  getPlanAllWeeks: () => { pre: any[]; pro: any[] };
}

/**
 * Initialize helper functions for export
 */
export async function initializeExportHelpers({
  project,
  findWeekAndDay,
  horarioPrelight,
  horarioPickup,
}: InitializeExportHelpersParams): Promise<InitializeExportHelpersReturn> {
  const { horarioPrelightFactory, horarioPickupFactory } = await import('../derive');

  const planKey = `needs_${project?.id || project?.nombre || 'demo'}`;
  const getPlanAllWeeks = () => {
    try {
      const obj = storage.getJSON<any>(planKey);
      if (!obj) return { pre: [], pro: [] };
      return needsDataToPlanData(obj);
    } catch {
      return { pre: [], pro: [] };
    }
  };

  const translateJornadaType = (tipo: string): string => {
    return translateJornadaTypeUtil(tipo, (key: string, defaultValue?: string) => getTranslation(key, defaultValue || key));
  };

  const horarioTexto = (iso: string) => {
    const { day } = findWeekAndDay(iso);
    const addInPlanning = getTranslation('reports.addInPlanning', 'Añadelo en Calendario');
    if (!day) return '';
    if ((day.tipo || '') === 'Descanso') return getTranslation('planning.rest', 'DESCANSO');
    const hasBase = Array.isArray(day.crewList) && day.crewList.length > 0;
    if (!hasBase) return '';
    const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Oficina' && day.tipo !== 'Rodaje Festivo' ? `${translateJornadaType(day.tipo)}: ` : '';
    if (!day.start || !day.end) return `${etiqueta}${addInPlanning}`;
    return `${etiqueta}${day.start}–${day.end}`;
  };

  const jornadaTipoTexto = (iso: string, blockKey: string = 'base') => {
    const { day } = findWeekAndDay(iso);
    if (!day) return '';
    const tipo = getReportDayType(day, blockKey);
    return tipo ? translateJornadaType(tipo) : '';
  };

  const resolvePersonaBlockKey = (pk: string, iso: string, blockKey?: string) =>
    resolvePersonBlockKey(pk, iso, findWeekAndDay, project, blockKey);

  const tExport = (key: string, defaultValue?: string) =>
    getTranslation(key, defaultValue || key);
  const {
    horarioTimesForBlock,
    horarioExtraByIndex: horarioExtraByIndexFn,
  } = createHorarioHelpers(findWeekAndDay, tExport);

  const horarioExtraByBlock = (blockKey: string, iso: string) => {
    const match = String(blockKey).match(/^extra:(\d+)$/);
    if (!match) return '';
    return horarioExtraByIndexFn(Number(match[1]))(iso);
  };

  let weekReportData: AnyRecord = {};

  const horarioPersonaTexto = (pk: string, iso: string, blockKey?: string) =>
    buildPersonScheduleText({
      data: weekReportData,
      findWeekAndDay,
      project,
      personKey: pk,
      iso,
      rowBlockKey: blockKey,
      planScheduleForBlock: horarioTimesForBlock,
    });

  const bindWeekReportData = (data: AnyRecord) => {
    weekReportData = data || {};
  };

  const jornadaTipoPersonaTexto = (pk: string, iso: string, blockKey?: string) => {
    const parsed = parsePersonKey(pk);
    const resolvedRole = resolveExportRoleMeta(project, parsed.role);
    const resolvedBlockKey = resolvePersonaBlockKey(pk, iso, blockKey);
    const roleLabel = resolvedRole.displayRole || parsed.role;
    const isScheduled = isPersonScheduledOnBlock(
      iso,
      roleLabel,
      parsed.name,
      findWeekAndDay,
      resolvedBlockKey,
      { roleId: parsed.role }
    );

    if (!isScheduled) {
      return getTranslation('planning.rest', 'DESCANSO');
    }

    return jornadaTipoTexto(iso, resolvedBlockKey);
  };

  const horarioPrelightFn = horarioPrelight || horarioPrelightFactory(findWeekAndDay);
  const horarioPickupFn = horarioPickup || horarioPickupFactory(findWeekAndDay);

  return {
    translateJornadaType,
    horarioTexto,
    jornadaTipoTexto,
    jornadaTipoPersonaTexto,
    resolvePersonaBlockKey,
    horarioPersonaTexto,
    horarioExtraByBlock,
    horarioPrelightFn,
    horarioPickupFn,
    getPlanAllWeeks,
  };
}
