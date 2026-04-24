import { esc } from '../htmlHelpers';
import { getTranslation, translateDayName } from '../translationHelpers';

type DayHeaderPalette = {
  headerBg: string;
  border: string;
  text?: string;
};

/**
 * Generate days header row
 */
export function generateDaysHeader(
  safeSemanaWithData: string[],
  dayNameFromISO: (iso: string, i: number) => string,
  toDisplayDate: (iso: string) => string,
  getDayPalette?: (iso: string) => DayHeaderPalette | null
): string {
  return `
      <tr>
        <th style="border:1px solid #9fcbe9;padding:6px;text-align:center;vertical-align:middle;background:linear-gradient(180deg, #d9ecfb 0%, #bfe4f8 100%);color:#0f172a;"><div class="th-label">&nbsp;</div></th>
        ${safeSemanaWithData
          .map((iso, i) => {
            const palette = getDayPalette?.(iso);
            const headerStyle = palette
              ? `border:1px solid ${palette.border};padding:6px;text-align:center;vertical-align:middle;background:${palette.headerBg};color:${palette.text || '#0f172a'};`
              : 'border:1px solid #9fcbe9;padding:6px;text-align:center;vertical-align:middle;background:linear-gradient(180deg, #d9ecfb 0%, #bfe4f8 100%);color:#0f172a;';
            return `
          <th style="${headerStyle}">
            <div class="th-label">${esc(translateDayName(dayNameFromISO(iso, i)))}<br/>${esc(toDisplayDate(iso))}</div>
          </th>`;
          })
          .join('')}
        <th style="border:1px solid #9fcbe9;padding:6px;text-align:center;vertical-align:middle;background:linear-gradient(180deg, #d9ecfb 0%, #bfe4f8 100%);color:#0f172a;font-weight:bold;"><div class="th-label">${esc(getTranslation('reports.total', 'Total'))}</div></th>
      </tr>`;
}

/**
 * Generate schedule header row
 */
export function generateScheduleHeader(
  safeSemanaWithData: string[],
  horarioTexto: (iso: string) => string,
  scheduleLabel: string = getTranslation('reports.scheduleBase', 'Horario equipo base')
): string {
  return `
      <tr>
        <th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;"><div class="th-label">${esc(scheduleLabel)}</div></th>
        ${safeSemanaWithData
          .map(
            iso =>
              `<th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;"><div class="th-label">${esc(
                horarioTexto(iso)
              )}</div></th>`
          )
          .join('')}
        <th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;"><div class="th-label">${esc(getTranslation('reports.week', 'Semana'))}</div></th>
      </tr>`;
}

/**
 * Generate team block title row
 */
export function generateTeamBlockTitle(
  label: string,
  colSpan: number,
  bgColor: string,
  textColor: string
): string {
  return `
      <tr class="block-title-row">
        <td colspan="${colSpan}" style="border:1px solid #dbe4ee;padding:8px;font-weight:700;background:${bgColor};color:${textColor};text-align:center;">
          ${label}
        </td>
      </tr>`;
}
