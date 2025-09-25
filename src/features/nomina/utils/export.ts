// Utils to build exportable HTML for Nómina

function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as const)[c as '&' | '<' | '>']
  );
}

export function buildNominaMonthHTML(
  project: any,
  monthKey: string,
  enrichedRows: any[],
  monthLabelEs: (key: string, withYear?: boolean) => string
) {
  const head = `
      <tr>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:left;">Persona</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Días trabajados</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total días</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Días Travel Day</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total travel days</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Horas extra</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total horas extra</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:left;">Dietas</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total dietas</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Transportes</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total transportes</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Kilometraje</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total kilometraje</th>
        <th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">TOTAL BRUTO</th>
      </tr>`;

  const body = enrichedRows
    .map(
      r => `
      <tr>
        <td style="border:1px solid #999;padding:6px;">${esc(r.role)} — ${esc(r.name)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._worked)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalDias.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._travel)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalTravel.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r.extras)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalExtras.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;">${esc(r._dietasLabel)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalDietas.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r.transporte)}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalTrans.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc((r.km || 0).toFixed(1))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;">${esc(r._totalKm.toFixed(2))}</td>
        <td style="border:1px solid #999;padding:6px;text-align:right;font-weight:600;">${esc(r._totalBruto.toFixed(2))}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(project?.nombre || 'Proyecto')} – Nómina ${esc(monthLabelEs(monthKey, true))}</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:20px;color:#111;">
  <h2 style="margin:0 0 10px 0;">${esc(project?.nombre || 'Proyecto')} – Nómina ${esc(monthLabelEs(monthKey, true))}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
    <thead>${head}</thead>
    <tbody>${body}</tbody>
  </table>
  <footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer>
</body></html>`;

  return html;
}

export function openPrintWindow(html: string) {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}


