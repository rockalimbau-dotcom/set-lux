import { esc } from '../htmlHelpers';
import { getTranslation, translateDayName } from '../translationHelpers';

/**
 * Generate days header row
 */
export function generateDaysHeader(
  safeSemanaWithData: string[],
  dayNameFromISO: (iso: string, i: number) => string,
  toDisplayDate: (iso: string) => string
): string {
  return `
      <tr>
        <th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;"><div class="th-label">&nbsp;</div></th>
        ${safeSemanaWithData
          .map(
            (iso, i) => `
          <th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;">
            <div class="th-label">${esc(translateDayName(dayNameFromISO(iso, i)))}<br/>${esc(toDisplayDate(iso))}</div>
          </th>`
          )
          .join('')}
        <th style="border:1px solid #7dbfe8;padding:6px;text-align:center;vertical-align:middle;background:#bfe4f8;color:#0f172a;font-weight:bold;"><div class="th-label">${esc(getTranslation('reports.total', 'Total'))}</div></th>
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
      <tr>
        <td colspan="${colSpan}" style="border:1px solid #999;padding:8px;font-weight:700;background:${bgColor};color:${textColor};text-align:center;">
          ${label}
        </td>
      </tr>`;
}
