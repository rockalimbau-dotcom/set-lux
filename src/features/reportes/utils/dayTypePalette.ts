import { AnyRecord } from '@shared/types/common';
import {
  getNeedsDayTypeForBlock,
  getNeedsDayTypePaletteForBlock,
  type NeedsBlockKey,
  type NeedsTheme,
} from '@features/necesidades/utils/dayTypeColors';

export type ReportBlockKey = NeedsBlockKey;

export function getReportDayType(
  day: AnyRecord | null | undefined,
  block: ReportBlockKey = 'base'
): string {
  return getNeedsDayTypeForBlock(day, block);
}

export function getReportDayTypePalette(
  day: AnyRecord | null | undefined,
  block: ReportBlockKey,
  theme: NeedsTheme
) {
  return getNeedsDayTypePaletteForBlock(day, block, theme);
}
