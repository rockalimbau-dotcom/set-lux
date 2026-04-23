import { AnyRecord } from '@shared/types/common';
import { getExtraBlocks } from './extra';
import { getNeedsDayTypePalette, type NeedsTheme } from '@features/necesidades/utils/dayTypeColors';

export type ReportBlockKey = 'base' | 'pre' | 'pick' | string;

export function getReportDayType(
  day: AnyRecord | null | undefined,
  block: ReportBlockKey = 'base'
): string {
  if (!day) return '';
  if (block === 'pre') return String(day?.prelightTipo || day?.crewTipo || day?.tipo || '');
  if (block === 'pick') return String(day?.pickupTipo || day?.crewTipo || day?.tipo || '');

  const extraMatch = String(block).match(/^extra:(\d+)$/);
  if (extraMatch) {
    const extraBlock = getExtraBlocks(day)[Number(extraMatch[1])];
    return String(extraBlock?.tipo || day?.refTipo || day?.crewTipo || day?.tipo || '');
  }

  return String(day?.crewTipo || day?.tipo || '');
}

export function getReportDayTypePalette(
  day: AnyRecord | null | undefined,
  block: ReportBlockKey,
  theme: NeedsTheme
) {
  return getNeedsDayTypePalette(getReportDayType(day, block), theme);
}
