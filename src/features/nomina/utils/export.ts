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
  // Helper function to generate extras summary text for export
  const generateExtrasText = (r: any): string => {
    const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
    const parts: string[] = [];
    
    if ((r.horasExtra || 0) > 0) {
      parts.push(`Horas extra x${r.horasExtra}`);
    }
    
    if ((r.turnAround || 0) > 0) {
      parts.push(`Turn Around x${r.turnAround}`);
    }
    
    if ((r.nocturnidad || 0) > 0) {
      parts.push(`Nocturnidad x${r.nocturnidad}`);
    }
    
    if ((r.penaltyLunch || 0) > 0) {
      parts.push(`Penalty lunch x${r.penaltyLunch}`);
    }
    
    if (parts.length === 0) {
      return String(totalExtras);
    }
    
    return `${totalExtras}<br/>${parts.join('<br/>')}`;
  };

  // Helper function to display empty string for zero values in export
  const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === null || value === undefined || value === 0) return '';
    return decimals > 0 ? value.toFixed(decimals) : String(value);
  };

  // Detect which columns have data to show/hide empty columns in export
  const columnVisibility = {
    holidays: enrichedRows.some(r => (r._holidays || 0) > 0),
    travel: enrichedRows.some(r => (r._travel || 0) > 0),
    extras: enrichedRows.some(r => (r.extras || 0) > 0),
    transporte: enrichedRows.some(r => (r.transporte || 0) > 0),
    km: enrichedRows.some(r => (r.km || 0) > 0),
    dietas: enrichedRows.some(r => (r._totalDietas || 0) > 0),
  };

  const headerCells = [
    '<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:left;">Persona</th>',
    '<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Días trabajados</th>',
    '<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total días</th>',
  ];

  if (columnVisibility.holidays) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Días festivos</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total días festivos</th>');
  }

  if (columnVisibility.travel) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Días Travel Day</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total travel days</th>');
  }

  if (columnVisibility.extras) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Horas extras</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total horas extra</th>');
  }

  if (columnVisibility.dietas) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:left;">Dietas</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total dietas</th>');
  }

  if (columnVisibility.transporte) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Transportes</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total transportes</th>');
  }

  if (columnVisibility.km) {
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Kilometraje</th>');
    headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">Total kilometraje</th>');
  }

  headerCells.push('<th style="border:1px solid #999;padding:6px;background:#1D4ED8;color:#fff;text-align:right;">TOTAL BRUTO</th>');

  const head = `<tr>${headerCells.join('')}</tr>`;

  const body = enrichedRows
    .map(r => {
      const dataCells = [
        `<td style="border:1px solid #999;padding:6px;">${esc(r.role)} — ${esc(r.name)}</td>`,
        `<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._worked))}</td>`,
        `<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalDias, 2))}</td>`,
      ];

      if (columnVisibility.holidays) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._holidays))}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalHolidays, 2))}</td>`);
      }

      if (columnVisibility.travel) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._travel))}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalTravel, 2))}</td>`);
      }

      if (columnVisibility.extras) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;">${esc(generateExtrasText(r))}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalExtras, 2))}</td>`);
      }

      if (columnVisibility.dietas) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;">${esc(r._dietasLabel)}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalDietas, 2))}</td>`);
      }

      if (columnVisibility.transporte) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r.transporte))}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalTrans, 2))}</td>`);
      }

      if (columnVisibility.km) {
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r.km, 1))}</td>`);
        dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;">${esc(displayValue(r._totalKm, 2))}</td>`);
      }

      dataCells.push(`<td style="border:1px solid #999;padding:6px;text-align:right;font-weight:600;">${esc((r._totalBruto || 0).toFixed(2))}</td>`);

      return `<tr>${dataCells.join('')}</tr>`;
    })
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


