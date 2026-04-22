import { PRICE_HEADERS, PRICE_ROLES } from '../shared.constants';

/**
 * Escapa caracteres HTML
 */
function esc(s: unknown): string {
  return String(s ?? '').replace(
    /[&<>]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as const)[c as '&' | '<' | '>']
  );
}

/**
 * Renderiza HTML para exportación de condiciones
 */
export function renderExportHTML(projectName: string, which: string, model: any): string {
  const table = `
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
    <thead>
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#0476D9;color:#fff;">Rol / Precio</th>
        ${PRICE_HEADERS.map(
          h =>
            `<th style="border:1px solid #999;padding:6px;text-align:left;background:#0476D9;color:#fff;">${esc(
              h
            )}</th>`
        ).join('')}
      </tr>
    </thead>
    <tbody>
      ${PRICE_ROLES.map(
        role => `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;">${esc(role)}</td>
          ${PRICE_HEADERS.map(
            h =>
              `<td style="border:1px solid #999;padding:6px;">${esc(
                model.prices?.[role]?.[h] ?? ''
              )}</td>`
          ).join('')}
        </tr>
      `
      ).join('')}
    </tbody>
  </table>`;

  const blocks = [
    ['Leyenda cálculos', model.legendRendered || ''],
    ['Festivos', model.festivos],
    ['Horarios', model.horarios],
    ['Dietas', model.dietas],
    ['Transportes', model.transportes],
    ['Alojamiento', model.alojamiento],
    ['Pre producción', model.prepro],
    ['Convenio', model.convenio],
  ]
    .map(
      ([title, txt]) => `
    <section style="margin:14px 0;">
      <h4 style="margin:0 0 6px 0;color:#0476D9;font-weight:700;">${esc(title)}</h4>
      <pre style="white-space:pre-wrap;margin:0;font-family:inherit;line-height:1.4;">${esc(
        txt
      )}</pre>
    </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(projectName)} – Condiciones (${esc(
    which
  )})</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:20px;color:#111;">
  <h2 style="margin:0 0 10px 0;">${esc(projectName)} – Condiciones (${esc(which)})</h2>
  ${table}
  ${blocks}
  <footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer>
</body></html>`;
}

