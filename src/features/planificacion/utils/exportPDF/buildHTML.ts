import { Week, DayInfo } from './types';
import { toDDMMYYYY, esc } from './helpers';

/**
 * Build HTML for planificación (simple version)
 */
export function buildPlanificacionHTML(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date
): string {
  const rows = (w: Week): string => {
    const monday = parseYYYYMMDD(w.startDate);
    const dayCells = (getter: (i: number) => any): string =>
      DAYS.map((_, i) => `<td>${esc(getter(i) ?? '')}</td>`).join('');
    const dateRow = DAYS.map((_, i) => toDDMMYYYY(addDays(monday, i)));

    return `
      <tr><th>Fecha</th>${dateRow
        .map(esc)
        .map(d => `<td>${d}</td>`)
        .join('')}</tr>
      <tr><th>Jornada</th>${dayCells(i => w.days?.[i]?.tipo || '')}</tr>
      <tr><th>Inicio</th>${dayCells(i => w.days?.[i]?.start || '')}</tr>
      <tr><th>Fin</th>${dayCells(i => w.days?.[i]?.end || '')}</tr>
      <tr><th>Corte cámara</th>${dayCells(i => w.days?.[i]?.cut || '')}</tr>
      <tr><th>Localización</th>${dayCells(i => w.days?.[i]?.loc || '')}</tr>
      <tr><th>Equipo</th>${DAYS.map((_, i) => {
        const team = (w.days?.[i]?.team || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pre' ? 'P' : m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        return `<td>${team}</td>`;
      }).join('')}</tr>
      <tr><th>Prelight</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.prelight || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pre' ? 'P' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        const hs = [w.days?.[i]?.prelightStart, w.days?.[i]?.prelightEnd]
          .filter(Boolean)
          .join('–');
        return `<td>${hs ? `<div>${esc(hs)}</div>` : ''}${lst}</td>`;
      }).join('')}</tr>
      <tr><th>Recogida</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.pickup || [])
          .map(m =>
            esc(
              `${m.role}${m.source === 'pick' ? 'R' : ''} ${m.name || ''}`.trim()
            )
          )
          .join(' · ');
        const hs = [w.days?.[i]?.pickupStart, w.days?.[i]?.pickupEnd]
          .filter(Boolean)
          .join('–');
        return `<td>${hs ? `<div>${esc(hs)}</div>` : ''}${lst}</td>`;
      }).join('')}</tr>
      <tr><th>Incidencias</th>${dayCells(i => w.days?.[i]?.issue || '')}</tr>
    `;
  };

  const weekBlocks = weeks
    .map(
      w => `
    <section class="wk">
      <h2>${esc(w.label)}</h2>
      <table class="plan">
        <thead><tr>
          <th>Fila / Día</th>
          ${DAYS.map(d => `<th>${d.name}</th>`).join('')}
        </tr></thead>
        <tbody>${rows(w)}</tbody>
      </table>
    </section>
  `
    )
    .join('');

  return `
  <div class="export-doc" style="background:#fff">
    <h1>${esc(project?.nombre || 'Proyecto')} – Planificación</h1>
    ${weekBlocks}
  </div>`;
}

