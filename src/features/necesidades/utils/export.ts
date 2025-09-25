const pad2 = (n: number): string => String(n).padStart(2, '0');
const parseYYYYMMDD = (s: string): Date => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};
const formatDDMM = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

interface DayInfo {
  idx: number;
  key: string;
  name: string;
}

interface DayValues {
  loc?: string;
  seq?: string;
  needLoc?: string;
  needProd?: string;
  needLight?: string;
  extraMat?: string;
  precall?: string;
  obs?: string;
  crewList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  crewTxt?: string;
  preList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  preTxt?: string;
  pickList?: Array<{ role?: string; name?: string; [key: string]: any }>;
  pickTxt?: string;
  [key: string]: any;
}

interface WeekEntry {
  label?: string;
  startDate?: string;
  [key: string]: any;
}

interface NeedsData {
  [weekId: string]: {
    days?: DayValues[];
    [key: string]: any;
  };
}

export function renderExportHTML(
  projectName: string,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );
  const DAYS: DayInfo[] = [
    { idx: 0, key: 'mon', name: 'Lunes' },
    { idx: 1, key: 'tue', name: 'Martes' },
    { idx: 2, key: 'wed', name: 'Miércoles' },
    { idx: 3, key: 'thu', name: 'Jueves' },
    { idx: 4, key: 'fri', name: 'Viernes' },
    { idx: 5, key: 'sat', name: 'Sábado' },
    { idx: 6, key: 'sun', name: 'Domingo' },
  ];
  const monday = parseYYYYMMDD(weekStart);
  const headerRow = DAYS.map(
    (_, i) =>
      `<th style="border:1px solid #999;padding:8px;background:#1D4ED8;color:#fff;min-width:190px;text-align:left">${esc(DAYS[i].name)}<br/>${esc(formatDDMM(addDays(monday, i)))}</th>`
  ).join('');
  const renderCell = (text: any): string =>
    `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;
  const stdRows = [
    { key: 'loc', label: 'Localización' },
    { key: 'seq', label: 'Secuencias' },
    { key: 'needLoc', label: 'Necesidades localizaciones' },
    { key: 'needProd', label: 'Necesidades producción' },
    { key: 'needLight', label: 'Necesidades luz' },
    { key: 'extraMat', label: 'Material extra' },
    { key: 'precall', label: 'Precall' },
    { key: 'obs', label: 'Observaciones' },
  ]
    .map(f => {
      const tds = DAYS.map(
        (_, i) =>
          `<td style="border:1px solid #999;padding:8px;vertical-align:top;min-width:190px;">${renderCell(valuesByDay[i]?.[f.key])}</td>`
      ).join('');
      return `<tr><td style="border:1px solid #999;padding:8px;font-weight:600;background:#f4f6ff;">${esc(f.label)}</td>${tds}</tr>`;
    })
    .join('');
  const listRow = (label: string, listKey: string, notesKey: string): string => {
    const tds = DAYS.map((_, i) => {
      const list = Array.isArray(valuesByDay[i]?.[listKey])
        ? valuesByDay[i][listKey]
        : [];
      const notes = valuesByDay[i]?.[notesKey] || '';
      const chips = list
        .map(m => {
          const role = (m?.role || '').toUpperCase();
          const name = m?.name || '';
          return `<div>• ${esc(role ? `${role}: ` : '')}${esc(name)}</div>`;
        })
        .join('');
      const block = `${chips}${notes ? `<hr style="margin:6px 0;border:none;border-top:1px solid #ddd;"/>` : ''}${renderCell(notes)}`;
      return `<td style="border:1px solid #999;padding:8px;vertical-align:top;min-width:190px;">${block}</td>`;
    }).join('');
    return `<tr><td style="border:1px solid #999;padding:8px;font-weight:600;background:#f4f6ff;">${esc(label)}</td>${tds}</tr>`;
  };
  const body =
    listRow('Equipo técnico', 'crewList', 'crewTxt') +
    stdRows +
    listRow('Equipo Prelight', 'preList', 'preTxt') +
    listRow('Equipo Recogida', 'pickList', 'pickTxt');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(projectName)} – Necesidades de Rodaje (${esc(weekLabel)})</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;"><h2 style="margin:0 0 10px 0;">${esc(projectName)} – ${esc(weekLabel)}</h2><table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;"><thead><tr><th style="border:1px solid #999;padding:8px;background:#1D4ED8;color:#fff;text-align:left;">Campo / Día</th>${headerRow}</tr></thead><tbody>${body}</tbody></table><footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer></body></html>`;
}

export function renderExportAllHTML(
  projectName: string, 
  weekEntries: [string, WeekEntry][], 
  needs: NeedsData
): string {
  const parts = weekEntries.map(([wid, wk]) => {
    const valuesByDay = Array.from({ length: 7 }).map(
      (_, i) => needs[wid]?.days?.[i] || {}
    );
    return renderExportHTML(
      projectName,
      wk.label || 'Semana',
      wk.startDate || '',
      valuesByDay
    );
  });
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(projectName)} – Necesidades (todas)</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;">${parts.join('<hr style="page-break-after:always;border:none;border-top:1px solid #ddd;margin:24px 0;" />')}<footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer></body></html>`;
}
