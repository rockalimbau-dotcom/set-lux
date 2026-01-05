import i18n from '../../../../i18n/config';
import { DayValues, WeekEntry, NeedsData } from './types';
import { buildNecesidadesHTML } from './htmlBuilders';
import { esc } from './helpers';

/**
 * Legacy function for rendering export HTML
 */
export function renderExportHTML(
  projectName: string,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  return buildNecesidadesHTML({ nombre: projectName }, weekLabel, weekStart, valuesByDay);
}

/**
 * Legacy function for rendering all export HTML
 */
export function renderExportAllHTML(
  projectName: string, 
  weekEntries: [string, WeekEntry][], 
  needs: NeedsData
): string {
  const parts = weekEntries.map(([wid, wk]) => {
    const valuesByDay = Array.from({ length: 7 }).map(
      (_, i) => needs[wid]?.days?.[i] || {}
    );
    return buildNecesidadesHTML(
      { nombre: projectName },
      wk.label || i18n.t('needs.week'),
      wk.startDate || '',
      valuesByDay
    );
  });
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(projectName)} – ${i18n.t('needs.title')} (${i18n.t('needs.all')})</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;">${parts.join('<hr style="page-break-after:always;border:none;border-top:1px solid #ddd;margin:24px 0;" />')}<footer style="margin-top:30px;font-size:10px;color:#888;">${i18n.t('footer.generatedBy')} SetLux</footer></body></html>`;
}

