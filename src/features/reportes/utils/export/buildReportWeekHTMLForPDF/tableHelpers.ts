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
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">&nbsp;</th>
        ${safeSemanaWithData
          .map(
            (iso, i) => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
            ${esc(translateDayName(dayNameFromISO(iso, i)))}<br/>${esc(toDisplayDate(iso))}
          </th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;font-weight:bold;">${esc(getTranslation('reports.total', 'Total'))}</th>
      </tr>`;
}

/**
 * Generate schedule header row
 */
export function generateScheduleHeader(
  safeSemanaWithData: string[],
  horarioTexto: (iso: string) => string
): string {
  return `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(getTranslation('planning.schedule', 'Horario'))}</th>
        ${safeSemanaWithData
          .map(
            iso =>
              `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(
                horarioTexto(iso)
              )}</th>`
          )
          .join('')}
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">${esc(getTranslation('reports.week', 'Semana'))}</th>
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

