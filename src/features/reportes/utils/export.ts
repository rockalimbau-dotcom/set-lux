interface Project {
  nombre?: string;
  [key: string]: any;
}

interface BuildReportWeekHTMLParams {
  project?: Project;
  title?: string;
  safeSemana: string[];
  dayNameFromISO: (iso: string, index: number, dayNames?: string[]) => string;
  toDisplayDate: (iso: string) => string;
  horarioTexto: (iso: string) => string;
  CONCEPTS: string[];
  data: {
    [personaKey: string]: {
      [concepto: string]: {
        [fecha: string]: string;
      };
    };
  };
  personaKey: (persona: any) => string;
  personaRole: (persona: any) => string;
  personaName: (persona: any) => string;
}

export function buildReportWeekHTML({
  project,
  title,
  safeSemana,
  dayNameFromISO,
  toDisplayDate,
  horarioTexto,
  CONCEPTS,
  data,
  personaKey,
  personaRole,
  personaName,
}: BuildReportWeekHTMLParams): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  const headDays = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">&nbsp;</th>
        ${safeSemana
          .map(
            (iso, i) => `
          <th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">
            ${esc(dayNameFromISO(iso, i))}<br/>${esc(toDisplayDate(iso))}
          </th>`
          )
          .join('')}
      </tr>`;

  const headHorario = `
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">Horario</th>
        ${safeSemana
          .map(
            iso =>
              `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">${esc(
                horarioTexto(iso)
              )}</th>`
          )
          .join('')}
      </tr>`;

  const allPersons = Array.isArray(Object.keys(data || {})) ? null : null; // no necesitamos enumerar aquí

  const body =
    (Array.isArray(safeSemana) ? safeSemana : []) &&
    (Array.isArray(CONCEPTS) ? true : true) &&
    (function () {
      // Genera por personas según data
      const personKeys = Object.keys(data || {});
      return personKeys
        .map(pk => {
          // pk es personaKey(p)
          // reconstruimos role/name desde una persona simulada
          const sampleConcept = data[pk] || {};
          // Intentamos obtener role/name desde las claves superiores externas si hiciera falta
          const [rolePart, ...nameParts] = String(pk).split('__');
          const role = rolePart || '';
          const name = nameParts.join('__');

          const head = `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;background:#f5f5f5;">
            ${esc(role ? `${role} — ${name}` : name)}
          </td>
          ${safeSemana
            .map(
              () => `<td style="border:1px solid #999;padding:6px;">&nbsp;</td>`
            )
            .join('')}
        </tr>`;

          const rows = CONCEPTS.map(
            c => `
        <tr>
          <td style="border:1px solid #999;padding:6px;">${esc(c)}</td>
          ${safeSemana
            .map(
              iso =>
                `<td style="border:1px solid #999;padding:6px;">${esc(
                  data?.[pk]?.[c]?.[iso] ?? ''
                )}</td>`
            )
            .join('')}
        </tr>`
          ).join('');

          return head + rows;
        })
        .join('');
    })();

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(
    project?.nombre || 'Proyecto'
  )} – ${esc(title || 'Semana')}</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:20px;color:#111;">
  <h2 style="margin:0 0 10px 0;">${esc(
    project?.nombre || 'Proyecto'
  )} – ${esc(title || 'Semana')}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
    <thead>
      ${headDays}
      ${headHorario}
    </thead>
    <tbody>
      ${body}
    </tbody>
  </table>
  <footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer>
</body></html>`;

  return html;
}
