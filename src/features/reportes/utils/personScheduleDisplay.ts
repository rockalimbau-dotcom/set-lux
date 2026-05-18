import { AnyRecord } from '@shared/types/common';
import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';
import { BLOCKS, isPersonScheduledOnBlock } from './plan';
import { parsePersonKey, resolveExportRoleMeta } from './export/dataHelpers';
import { resolvePersonBlockKey } from './resolvePersonBlockKey';

export function normalizeStoredTime(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return raw;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return raw;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatScheduleTimeRange(start: string, end: string): string {
  const safeStart = normalizeStoredTime(start);
  const safeEnd = normalizeStoredTime(end);
  if (safeStart && safeEnd) return `${safeStart}–${safeEnd}`;
  return safeStart || safeEnd || '';
}

function planTimesForBlock(day: AnyRecord, blockKey: string): { start: string; end: string } {
  if (blockKey === BLOCKS.pre) {
    return {
      start: normalizeStoredTime(day.prelightStart || day.preStart || ''),
      end: normalizeStoredTime(day.prelightEnd || day.preEnd || ''),
    };
  }
  if (blockKey === BLOCKS.pick) {
    return {
      start: normalizeStoredTime(day.pickupStart || day.pickStart || ''),
      end: normalizeStoredTime(day.pickupEnd || day.pickEnd || ''),
    };
  }
  const extraMatch = String(blockKey).match(/^extra:(\d+)$/);
  if (extraMatch) {
    const block = normalizeExtraBlocks(day)[Number(extraMatch[1])];
    return {
      start: normalizeStoredTime(block?.start || ''),
      end: normalizeStoredTime(block?.end || ''),
    };
  }
  if (blockKey === BLOCKS.extra) {
    return {
      start: normalizeStoredTime(day.refStart || ''),
      end: normalizeStoredTime(day.refEnd || ''),
    };
  }
  return {
    start: normalizeStoredTime(day.start || day.crewStart || ''),
    end: normalizeStoredTime(day.end || day.crewEnd || ''),
  };
}

function readSavedSchedule(
  data: AnyRecord,
  personKey: string,
  blockKey: string,
  iso: string
): { start?: string; end?: string } | undefined {
  const direct = data?.__schedule__?.[personKey]?.[blockKey]?.[iso];
  if (direct) return direct;
  if (blockKey === BLOCKS.extra) {
    return data?.__schedule__?.[personKey]?.['extra:0']?.[iso];
  }
  return undefined;
}

export type BuildPersonScheduleTextParams = {
  data: AnyRecord;
  findWeekAndDay: (iso: string) => { day?: AnyRecord };
  project?: unknown;
  personKey: string;
  iso: string;
  rowBlockKey?: string;
  planScheduleForBlock: (iso: string, blockKey: string) => string;
};

/**
 * Horario mostrado en reportes: plan del bloque correcto + overrides en data.__schedule__.
 */
export function buildPersonScheduleText({
  data,
  findWeekAndDay,
  project,
  personKey,
  iso,
  rowBlockKey = 'base',
  planScheduleForBlock,
}: BuildPersonScheduleTextParams): string {
  const { day } = findWeekAndDay(iso);
  if (!day || day.tipo === 'Descanso') return '';

  const parsed = parsePersonKey(personKey);
  const resolvedBlockKey = resolvePersonBlockKey(
    personKey,
    iso,
    findWeekAndDay,
    project,
    rowBlockKey || parsed.block || 'base'
  );

  const resolvedRole = resolveExportRoleMeta(project, parsed.role);
  const roleLabel = resolvedRole.displayRole || parsed.role;
  const isScheduled = isPersonScheduledOnBlock(
    iso,
    roleLabel,
    parsed.name,
    findWeekAndDay as (iso: string) => { day?: AnyRecord },
    resolvedBlockKey,
    { roleId: parsed.role }
  );
  if (!isScheduled) return '';

  const planTimes = planTimesForBlock(day, resolvedBlockKey);
  const saved = readSavedSchedule(data, personKey, String(resolvedBlockKey), iso);
  const start = normalizeStoredTime(saved?.start ?? planTimes.start);
  const end = normalizeStoredTime(saved?.end ?? planTimes.end);
  const range = formatScheduleTimeRange(start, end);
  if (range) return range;

  return planScheduleForBlock(iso, resolvedBlockKey);
}
