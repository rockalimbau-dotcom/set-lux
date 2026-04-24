import { storage } from '@shared/services/localStorage.service';
import { getTranslation } from './translationHelpers';
import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';
import { getReportDayType } from '../dayTypePalette';
import { getDayBlockList, isPersonScheduledOnBlock } from '../plan';
import { parsePersonKey, resolveExportRoleMeta } from './dataHelpers';
import { getExtraBlocks } from '../extra';
import { norm } from '../text';
import { stripRoleSuffix } from '@shared/constants/roles';

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
  horarioPrelightFn: (iso: string) => string;
  horarioPickupFn: (iso: string) => string;
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

  const resolvePersonaBlockKey = (pk: string, iso: string, blockKey?: string) => {
    const parsed = parsePersonKey(pk);
    const { day } = findWeekAndDay(iso);
    if (!day) return String(blockKey || parsed.block || 'base');

    const preferredBlock = String(blockKey || parsed.block || 'base');
    const resolvedRole = resolveExportRoleMeta(project, parsed.role);
    const roleLabel = resolvedRole.displayRole || parsed.role;
    const candidates = [
      preferredBlock,
      'base',
      'pre',
      'pick',
      ...getExtraBlocks(day).map((_, index) => `extra:${index}`),
      'extra',
    ].filter((candidate, index, list) => list.indexOf(candidate) === index);

    const roleId = parsed.role;
    for (const candidate of candidates) {
      const scheduled = isPersonScheduledOnBlock(
        iso,
        roleLabel,
        parsed.name,
        findWeekAndDay,
        candidate,
        { roleId }
      );
      if (scheduled) return candidate;
    }

    const wantedName = norm(parsed.name);
    const wantedRole = norm(stripRoleSuffix(parsed.role));
    const matchesMember = (member: any) => {
      if (norm(member?.name) !== wantedName) return false;
      const memberRoleId = String(member?.roleId || '').trim();
      if (roleId && memberRoleId) return memberRoleId === roleId;
      const memberRole = norm(stripRoleSuffix(String(member?.role || '')));
      return !wantedRole || !memberRole || memberRole === wantedRole;
    };

    if (getDayBlockList(day, 'base').some(matchesMember)) return 'base';
    if (getDayBlockList(day, 'pre').some(matchesMember)) return 'pre';
    if (getDayBlockList(day, 'pick').some(matchesMember)) return 'pick';
    const extraIndex = getExtraBlocks(day).findIndex(block => (block.list || []).some(matchesMember));
    if (extraIndex >= 0) return `extra:${extraIndex}`;
    if (getDayBlockList(day, 'extra').some(matchesMember)) return 'extra';

    return preferredBlock;
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
    horarioPrelightFn,
    horarioPickupFn,
    getPlanAllWeeks,
  };
}
