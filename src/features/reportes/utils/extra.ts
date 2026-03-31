import { normalizeExtraBlocks } from '@shared/utils/extraBlocks';

const blockHasVisibleContent = (block: {
  tipo?: string;
  start?: string;
  end?: string;
  text?: string;
  list?: any[];
}) =>
  String(block?.tipo || '').trim() !== '' ||
  String(block?.start || '').trim() !== '' ||
  String(block?.end || '').trim() !== '' ||
  String(block?.text || '').trim() !== '' ||
  (Array.isArray(block?.list) && block.list.length > 0);

export const getExtraBlocks = (day: any) =>
  normalizeExtraBlocks(day || {}).filter(blockHasVisibleContent);

export const hasExtraBlockContent = (day: any) => getExtraBlocks(day).length > 0;

export const getExtraWindow = (day: any): { start: string | null; end: string | null } => {
  const blocks = getExtraBlocks(day)
    .filter(block => String(block.start || '').trim() || String(block.end || '').trim());

  if (blocks.length === 0) {
    return {
      start: day?.refStart || null,
      end: day?.refEnd || null,
    };
  }

  const starts = blocks.map(block => String(block.start || '').trim()).filter(Boolean).sort();
  const ends = blocks.map(block => String(block.end || '').trim()).filter(Boolean).sort();

  return {
    start: starts[0] || null,
    end: ends[ends.length - 1] || null,
  };
};

export const formatExtraSchedules = (
  day: any,
  addInPlanningLabel: string,
  _t: (key: string, defaultValue?: string) => string
): string => {
  const blocks = getExtraBlocks(day);
  if (blocks.length === 0) return '';

  const labels = blocks.map(block => {
    const start = String(block.start || '').trim();
    const end = String(block.end || '').trim();
    const hasPeople = Array.isArray(block.list) && block.list.length > 0;
    return start && end ? `${start}–${end}` : hasPeople ? addInPlanningLabel : '';
  }).filter(Boolean);

  return labels.join(' · ');
};

export const getExtraBlockByIndex = (day: any, index: number) => {
  const blocks = getExtraBlocks(day);
  return blocks[index] || null;
};

export const getExtraBlockCount = (day: any): number => getExtraBlocks(day).length;

export const getExtraBlockWindowByIndex = (
  day: any,
  index: number
): { start: string | null; end: string | null } => {
  const block = getExtraBlockByIndex(day, index);
  if (!block) return { start: null, end: null };
  return {
    start: String(block.start || '').trim() || null,
    end: String(block.end || '').trim() || null,
  };
};

export const formatExtraScheduleByIndex = (
  day: any,
  index: number,
  addInPlanningLabel: string,
  _t: (key: string, defaultValue?: string) => string
): string => {
  const block = getExtraBlockByIndex(day, index);
  if (!block) return '';
  const start = String(block.start || '').trim();
  const end = String(block.end || '').trim();
  const hasPeople = Array.isArray(block.list) && block.list.length > 0;
  return start && end ? `${start}–${end}` : hasPeople ? addInPlanningLabel : '';
};
