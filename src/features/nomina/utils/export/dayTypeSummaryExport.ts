import { getNeedsDayTypePalette } from '@features/necesidades/utils/dayTypeColors';
import type { DayTypeSummaryItem } from '../../components/DayTypeSummaryLines';

export function renderDayTypeSummaryDetailItem(item: DayTypeSummaryItem): string {
  const palette = getNeedsDayTypePalette(item.canonicalType, 'light');
  const label = `${item.label} x${item.count}`;
  if (!palette) {
    return `<span class="summary-detail-item">${label}</span>`;
  }
  return `<span class="summary-detail-item" style="color:${palette.controlText};">${label}</span>`;
}

export function renderDayTypeSummaryDetails(items: DayTypeSummaryItem[]): string {
  return items
    .filter(item => item.count > 0)
    .map(renderDayTypeSummaryDetailItem)
    .join('');
}
