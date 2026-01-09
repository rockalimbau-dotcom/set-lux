// Utilidades de exportación HTML/PDF para Planificación

const pad2 = (n: number): string => String(n).padStart(2, '0');
const toDDMMYYYY = (d: Date): string =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const esc = (s: any = ''): string =>
  String(s).replace(
    /[&<>"]/g,
    (m: string) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
      })[m] || m
  );

interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

interface Day {
  tipo?: string;
  start?: string;
  end?: string;
  cut?: string;
  loc?: string;
  team?: Array<{ role?: string; name?: string; source?: string }>;
  prelight?: Array<{ role?: string; name?: string; source?: string }>;
  pickup?: Array<{ role?: string; name?: string; source?: string }>;
  prelightStart?: string;
  prelightEnd?: string;
  pickupStart?: string;
  pickupEnd?: string;
  issue?: string;
  [key: string]: any;
}

interface Week {
  label: string;
  startDate: string;
  days?: Day[];
  [key: string]: any;
}

export function renderExportHTML(
  projectName: string,
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
          .map(m => {
            // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), no añadir sufijo P/R
            const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF') && m.role.length > 3);
            const suffix = isRefRole ? '' : (m.source === 'pre' ? 'P' : m.source === 'pick' ? 'R' : '');
            return esc(`${m.role}${suffix} ${m.name || ''}`.trim());
          })
          .join(' · ');
        return `<td>${team}</td>`;
      }).join('')}</tr>
      <tr><th>Prelight</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.prelight || [])
          .map(m => {
            // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), no añadir sufijo P
            const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF') && m.role.length > 3);
            const suffix = isRefRole ? '' : (m.source === 'pre' ? 'P' : '');
            return esc(`${m.role}${suffix} ${m.name || ''}`.trim());
          })
          .join(' · ');
        const hs = [w.days?.[i]?.prelightStart, w.days?.[i]?.prelightEnd]
          .filter(Boolean)
          .join('–');
        return `<td>${hs ? `<div>${esc(hs)}</div>` : ''}${lst}</td>`;
      }).join('')}</tr>
      <tr><th>Recogida</th>${DAYS.map((_, i) => {
        const lst = (w.days?.[i]?.pickup || [])
          .map(m => {
            // Si el rol es REF o empieza con REF (REFG, REFBB, etc.), no añadir sufijo R
            const isRefRole = m.role === 'REF' || (m.role && m.role.startsWith('REF') && m.role.length > 3);
            const suffix = isRefRole ? '' : (m.source === 'pick' ? 'R' : '');
            return esc(`${m.role}${suffix} ${m.name || ''}`.trim());
          })
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
    <h1>${esc(projectName)} – Planificación</h1>
    ${weekBlocks}
      </div>`;
}

export function openPrintWindow(html: string, title: string = 'Documento'): void {
  const win = window.open(
    '',
    '_blank',
    'noopener,noreferrer,width=1024,height=768'
  );
  if (!win) return;
  win.document.open();
  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {}
  }, 150);
}
