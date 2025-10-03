// Utils to build exportable HTML for Nómina
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  // Helper function to generate dietas summary text for export
  const generateDietasText = (r: any): string => {
    const want = [
      'Comida',
      'Cena',
      'Dieta sin pernoctar',
      'Dieta completa + desayuno',
      'Gastos de bolsillo',
      'Ticket',
    ];
    const parts: string[] = [];
    let totalDietas = 0;
    
    for (const label of want) {
      if (label === 'Ticket') {
        if (r.ticketTotal > 0) {
          parts.push(`Ticket €${r.ticketTotal.toFixed(2)}`);
          totalDietas += 1; // Contar ticket como 1 dieta
        }
      } else {
        const cnt = r.dietasCount?.get(label) || 0;
        if (cnt > 0) {
          parts.push(`${label} x${cnt}`);
          totalDietas += cnt;
        }
      }
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div class="dietas-total">${totalDietas}</div><div class="dietas-pills">${parts.map(part => `<div>${part}</div>`).join('')}</div>`;
  };

  // Helper function to generate extras summary text for export
  const generateExtrasText = (r: any): string => {
    const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
    const parts: string[] = [];
    
    if ((r.horasExtra || 0) > 0) {
      parts.push(`<div>Hora extra x${r.horasExtra}</div>`);
    }
    
    if ((r.turnAround || 0) > 0) {
      parts.push(`<div>Turn Around x${r.turnAround}</div>`);
    }
    
    if ((r.nocturnidad || 0) > 0) {
      parts.push(`<div class="nocturnidad">Nocturnidad x${r.nocturnidad}</div>`);
    }
    
    if ((r.penaltyLunch || 0) > 0) {
      parts.push(`<div>Penalty lunch x${r.penaltyLunch}</div>`);
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div class="extras-total">${totalExtras}</div><div class="extras-pills">${parts.join('')}</div>`;
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
        '<th>Persona</th>',
        '<th>Días trabajados</th>',
        '<th>Total días</th>',
      ];

  if (columnVisibility.holidays) {
    headerCells.push('<th>Días festivos</th>');
    headerCells.push('<th>Total días festivos</th>');
  }

  if (columnVisibility.travel) {
    headerCells.push('<th>Días Travel Day</th>');
    headerCells.push('<th>Total travel days</th>');
  }

  if (columnVisibility.extras) {
    headerCells.push('<th>Horas extras</th>');
    headerCells.push('<th>Total horas extra</th>');
  }

  if (columnVisibility.dietas) {
    headerCells.push('<th>Dietas</th>');
    headerCells.push('<th>Total dietas</th>');
  }

  if (columnVisibility.transporte) {
    headerCells.push('<th>Transportes</th>');
    headerCells.push('<th>Total transportes</th>');
  }

  if (columnVisibility.km) {
    headerCells.push('<th>Kilometraje</th>');
    headerCells.push('<th>Total kilometraje</th>');
  }

  headerCells.push('<th>TOTAL BRUTO</th>');

  const head = `<tr>${headerCells.join('')}</tr>`;

  const body = enrichedRows
    .map(r => {
      const roleForColor = String(r.role || '').replace(/[PR]$/, '');
      const roleColor =
        (ROLE_COLORS as any)[roleForColor] ||
        (ROLE_COLORS as any)[roleLabelFromCode(roleForColor)] ||
        (roleForColor === 'REF' ? { bg: '#F59E0B', fg: '#111' } : { bg: '#444', fg: '#fff' });

      const dataCells = [
        `<td class="text-left"><span class="role-badge" style="background:${esc(roleColor.bg)};color:${esc(roleColor.fg)}">${esc(r.role)}</span>${esc(r.name)}</td>`,
        `<td>${esc(displayValue(r._worked))}</td>`,
        `<td>${esc(displayValue(r._totalDias, 2))}</td>`,
      ];

      if (columnVisibility.holidays) {
        dataCells.push(`<td>${esc(displayValue(r._holidays))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalHolidays, 2))}</td>`);
      }

      if (columnVisibility.travel) {
        dataCells.push(`<td>${esc(displayValue(r._travel))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalTravel, 2))}</td>`);
      }

      if (columnVisibility.extras) {
        dataCells.push(`<td class="extras-cell">${generateExtrasText(r)}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalExtras, 2))}</td>`);
      }

      if (columnVisibility.dietas) {
        dataCells.push(`<td class="dietas-cell">${generateDietasText(r)}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalDietas, 2))}</td>`);
      }

      if (columnVisibility.transporte) {
        dataCells.push(`<td>${esc(displayValue(r.transporte))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalTrans, 2))}</td>`);
      }

      if (columnVisibility.km) {
        dataCells.push(`<td>${esc(displayValue(r.km, 1))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalKm, 2))}</td>`);
      }

      dataCells.push(`<td class="total-cell">${esc((r._totalBruto || 0).toFixed(2))}</td>`);

      return `<tr>${dataCells.join('')}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – Nómina ${esc(monthLabelEs(monthKey, true))}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    @media print { body { margin: 0; } }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
    }
    
    .header {
      background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
      color: white;
      padding: 24px 32px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 24px 32px;
    }
    
    .info-panel {
      background: #f1f5f9;
      padding: 16px 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      gap: 48px;
      align-items: center;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .info-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      border: 2px solid #1e40af;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 16px 12px;
      text-align: center;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 1px solid white;
      border-right: 1px solid white;
      border-top: 1px solid white;
      border-bottom: 1px solid white;
    }
    
    td {
      padding: 14px 12px;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 2px solid #1e40af;
      vertical-align: top;
      background: white;
      text-align: center;
      font-weight: 400;
      color: #1e293b;
    }
    
    td.text-right {
      text-align: right;
    }
    
    td.text-left {
      text-align: left;
    }
    
    tr:hover td {
      background: #f8fafc;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .person-cell {
      font-weight: 600;
      color: #1e293b;
    }
    
    .role-badge {
      display: inline-block;
      padding: 1px 2px;
      border-radius: 2px;
      font-size: 6px;
      font-weight: 700;
      margin-right: 2px;
    }
    
    .total-cell {
      font-weight: 700;
      font-size: 14px;
      color: #f97316;
    }
    
    .footer {
      text-align: center;
      padding: 6px 0; /* increase padding to ensure visibility */
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-shrink: 0;
      width: 100%;
      margin-bottom: 8px; /* separate from bottom edge */
    }
    
    .setlux-logo {
      font-weight: 700;
      font-size: 7px;
    }
    
    .setlux-logo .set {
      color: #f97316;
    }
    
    .setlux-logo .lux {
      color: #3b82f6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nómina - ${esc(monthLabelEs(monthKey, true))}</h1>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">Producción</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${esc(project?.nombre || '—')}</div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <span>Generado automáticamente por</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;

  return html;
}

// PDF-optimized HTML generation
export function buildNominaMonthHTMLForPDF(
  project: any,
  monthKey: string,
  enrichedRows: any[],
  monthLabelEs: (key: string, withYear?: boolean) => string,
  _currentPage: number = 1,
  _totalPages: number = 1
) {
  // Helper function to generate dietas summary text for export
  const generateDietasText = (r: any): string => {
    const want = [
      'Comida',
      'Cena',
      'Dieta sin pernoctar',
      'Dieta completa + desayuno',
      'Gastos de bolsillo',
      'Ticket',
    ];
    const parts: string[] = [];
    let totalDietas = 0;
    
    for (const label of want) {
      if (label === 'Ticket') {
        if (r.ticketTotal > 0) {
          parts.push(`Ticket €${r.ticketTotal.toFixed(2)}`);
          totalDietas += 1; // Contar ticket como 1 dieta
        }
      } else {
        const cnt = r.dietasCount?.get(label) || 0;
        if (cnt > 0) {
          parts.push(`${label} x${cnt}`);
          totalDietas += cnt;
        }
      }
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div class="dietas-total">${totalDietas}</div><div class="dietas-pills">${parts.map(part => `<div>${part}</div>`).join('')}</div>`;
  };

  // Helper function to generate extras summary text for export
  const generateExtrasText = (r: any): string => {
    const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
    const parts: string[] = [];
    
    if ((r.horasExtra || 0) > 0) {
      parts.push(`<div>Hora extra x${r.horasExtra}</div>`);
    }
    
    if ((r.turnAround || 0) > 0) {
      parts.push(`<div>Turn Around x${r.turnAround}</div>`);
    }
    
    if ((r.nocturnidad || 0) > 0) {
      parts.push(`<div class="nocturnidad">Nocturnidad x${r.nocturnidad}</div>`);
    }
    
    if ((r.penaltyLunch || 0) > 0) {
      parts.push(`<div>Penalty lunch x${r.penaltyLunch}</div>`);
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div class="extras-total">${totalExtras}</div><div class="extras-pills">${parts.join('')}</div>`;
  };

  // Helper function to display empty string for zero values
  const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === null || value === undefined || value === 0) return '';
    return decimals > 0 ? value.toFixed(decimals) : String(value);
  };

  // Column visibility logic
  const columnVisibility = {
    holidays: enrichedRows.some(r => (r._holidays || 0) > 0),
    travel: enrichedRows.some(r => (r._travel || 0) > 0),
    extras: enrichedRows.some(r => (r.extras || 0) > 0),
    transporte: enrichedRows.some(r => (r.transporte || 0) > 0),
    km: enrichedRows.some(r => (r.km || 0) > 0),
    dietas: enrichedRows.some(r => (r._totalDietas || 0) > 0),
  };

  // Build header cells
  const headerCells = [
    '<th>Persona</th>',
    '<th>Días trabajados</th>',
    '<th>Total días</th>',
  ];

  if (columnVisibility.holidays) {
    headerCells.push('<th>Días festivos</th>');
    headerCells.push('<th>Total días festivos</th>');
  }

  if (columnVisibility.travel) {
    headerCells.push('<th>Días Travel Day</th>');
    headerCells.push('<th>Total travel days</th>');
  }

  if (columnVisibility.extras) {
    headerCells.push('<th>Horas extras</th>');
    headerCells.push('<th>Total horas extra</th>');
  }

  if (columnVisibility.dietas) {
    headerCells.push('<th>Dietas</th>');
    headerCells.push('<th>Total dietas</th>');
  }

  if (columnVisibility.transporte) {
    headerCells.push('<th>Transportes</th>');
    headerCells.push('<th>Total transportes</th>');
  }

  if (columnVisibility.km) {
    headerCells.push('<th>Kilometraje</th>');
    headerCells.push('<th>Total kilometraje</th>');
  }

  headerCells.push('<th>TOTAL BRUTO</th>');
  const head = `<tr>${headerCells.join('')}</tr>`;

  // Build body rows
  const body = enrichedRows
    .map(r => {
      // Unify role color logic with HTML export: strip P/R suffix and fallback via role label
      const roleForColor = String(r.role || '').replace(/[PR]$/, '');
      const roleColor =
        (ROLE_COLORS as any)[roleForColor] ||
        (ROLE_COLORS as any)[roleLabelFromCode(roleForColor)] ||
        (roleForColor === 'REF' ? { bg: '#F59E0B', fg: '#111' } : { bg: '#444', fg: '#fff' });
      
      const dataCells = [
        `<td class="text-left"><span class="role-badge" style="background:${esc(roleColor.bg)};color:${esc(roleColor.fg)}">${esc(r.role)}</span>${esc(r.name)}</td>`,
        `<td>${esc(displayValue(r._worked))}</td>`,
        `<td>${esc(displayValue(r._totalDias, 2))}</td>`,
      ];

      if (columnVisibility.holidays) {
        dataCells.push(`<td>${esc(displayValue(r._holidays))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalHolidays, 2))}</td>`);
      }

      if (columnVisibility.travel) {
        dataCells.push(`<td>${esc(displayValue(r._travel))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalTravel, 2))}</td>`);
      }

      if (columnVisibility.extras) {
        dataCells.push(`<td class="extras-cell">${generateExtrasText(r)}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalExtras, 2))}</td>`);
      }

      if (columnVisibility.dietas) {
        dataCells.push(`<td class="dietas-cell">${generateDietasText(r)}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalDietas, 2))}</td>`);
      }

      if (columnVisibility.transporte) {
        dataCells.push(`<td>${esc(displayValue(r.transporte))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalTrans, 2))}</td>`);
      }

      if (columnVisibility.km) {
        dataCells.push(`<td>${esc(displayValue(r.km, 1))}</td>`);
        dataCells.push(`<td>${esc(displayValue(r._totalKm, 2))}</td>`);
      }

      dataCells.push(`<td class="total-cell">${esc((r._totalBruto || 0).toFixed(2))}</td>`);

      return `<tr>${dataCells.join('')}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – Nómina ${esc(monthLabelEs(monthKey, true))}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      color: #1e293b;
      line-height: 1.3;
      font-size: 11px; /* moderate base font */
    }
    
    .container {
      /* Fixed size to match html2canvas capture (A4 landscape @96dpi) */
      width: 1123px;
      height: 794px;
      background: white;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
      color: white;
      padding: 8px 0;
      text-align: center;
      flex-shrink: 0;
      width: 100%;
    }
    
    .header h1 {
      margin: 0;
      font-size: 16px; /* moderate title */
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 8px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .info-panel {
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      display: flex;
      gap: 20px;
      align-items: center;
      flex-shrink: 0;
      justify-content: center;
      width: 100%;
      max-width: 100%;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .info-label {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    
    .info-value {
      font-size: 11px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .table-container {
      background: white;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto; /* center horizontally */
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px; /* increased base cell font */
      border: 1px solid #1e40af;
      flex: 1;
      table-layout: auto;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 3px 4px; /* increased padding */
      text-align: center;
      font-weight: 600;
      font-size: 11px; /* larger header font */
      text-transform: uppercase;
      letter-spacing: 0.1px;
      border-left: 1px solid white;
      border-right: 1px solid white;
      border-top: 1px solid white;
      border-bottom: 1px solid white;
      overflow: hidden;
      white-space: nowrap;
      height: 16px;
      line-height: 14px;
    }
    
    td {
      padding: 3px 4px; /* increased padding */
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #1e40af;
      vertical-align: top;
      background: white;
      text-align: center;
      font-weight: 400;
      color: #1e293b;
      font-size: 10px; /* larger cell font */
      overflow: hidden;
      height: 18px;
      line-height: 14px;
    }
    
    td.text-right {
      text-align: right;
    }
    
    td.text-left {
      text-align: left;
    }
    
    .person-cell {
      font-weight: 600;
      color: #1e293b;
    }
    
    .role-badge {
      display: inline-block;
      padding: 1px 2px;
      border-radius: 2px;
      font-size: 8px; /* slightly larger */
      font-weight: 700;
      margin-right: 2px;
    }
    
    /* Column widths - much thinner, adapted to content */
    th:nth-child(1), td:nth-child(1) { width: 15%; } /* Persona */
    th:nth-child(2), td:nth-child(2) { width: 6%; }  /* Días trabajados */
    th:nth-child(3), td:nth-child(3) { width: 7%; }  /* Total días */
    th:nth-child(4), td:nth-child(4) { width: 5%; }  /* Días festivos */
    th:nth-child(5), td:nth-child(5) { width: 6%; }  /* Total días festivos */
    th:nth-child(6), td:nth-child(6) { width: 5%; }  /* Días Travel Day */
    th:nth-child(7), td:nth-child(7) { width: 6%; }  /* Total travel days */
    th:nth-child(8), td:nth-child(8) { width: 12%; } /* Horas extras */
    th:nth-child(9), td:nth-child(9) { width: 6%; }  /* Total horas extra */
    th:nth-child(10), td:nth-child(10) { width: 10%; } /* Dietas */
    th:nth-child(11), td:nth-child(11) { width: 5%; }  /* Total dietas */
    th:nth-child(12), td:nth-child(12) { width: 4%; }  /* Transportes */
    th:nth-child(13), td:nth-child(13) { width: 5%; }  /* Total transportes */
    th:nth-child(14), td:nth-child(14) { width: 4%; }  /* Kilometraje */
    th:nth-child(15), td:nth-child(15) { width: 5%; }  /* Total kilometraje */
    th:nth-child(16), td:nth-child(16) { width: 7%; }  /* TOTAL BRUTO */
    
    .extras-cell {
      font-size: 9px; /* improve legibility */
      line-height: 1.25;
    }
    
    .extras-total {
      font-weight: 600;
      margin-bottom: 0px;
      color: #1e293b;
      font-size: 8px; /* improve legibility */
      display: inline-block; /* allow spacing from pills */
      margin-right: 6px;
    }
    
    .extras-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 4px; /* separate pills */
      align-content: flex-start;
    }
    
    .extras-pills div {
      background: #A0D3F2;
      color: #1e293b;
      padding: 2px 3px;
      border-radius: 2px;
      font-size: 6px; /* one step smaller */
      font-weight: 500; /* not bold */
      line-height: 1.2; /* avoid overlap */
      display: inline-flex; /* center content */
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-right: 4px;
      margin-bottom: 2px;
    }
    
    .extras-pills div.nocturnidad {
      background: #A0D3F2;
      color: #1e293b;
    }
    
    .dietas-cell {
      font-size: 9px; /* improve legibility */
      line-height: 1.25;
    }
    
    .dietas-total {
      font-weight: 600;
      margin-bottom: 0px;
      color: #1e293b;
      font-size: 8px; /* improve legibility */
      display: inline-block; /* allow spacing from pills */
      margin-right: 6px;
    }
    
    .dietas-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 4px; /* separate pills */
      align-content: flex-start;
    }
    
    .dietas-pills div {
      background: #A0D3F2;
      color: #1e293b;
      padding: 2px 3px;
      border-radius: 2px;
      font-size: 6px; /* one step smaller */
      font-weight: 500; /* not bold */
      line-height: 1.2; /* avoid overlap */
      display: inline-flex; /* center content */
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-right: 4px;
      margin-bottom: 2px;
    }
    
    .total-cell {
      font-weight: 700;
      font-size: 12px;
      color: #f97316;
    }
    
    .footer {
      text-align: center;
      padding: 10px 0;
      color: #64748b;
      font-size: 6px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex-shrink: 0;
      width: 100%;
    }
    
    .setlux-logo {
      font-weight: 700;
      font-size: 7px;
    }
    
    .setlux-logo .set {
      color: #f97316;
    }
    
    .setlux-logo .lux {
      color: #3b82f6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nómina - ${esc(monthLabelEs(monthKey, true))}</h1>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">Producción</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <span>Generado por</span>
      <span class="setlux-logo">
        <span class="set">Set</span><span class="lux">Lux</span>
      </span>
    </div>
  </div>
</body>
</html>`;

  return html;
}

export function openPrintWindow(html: string) {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// PDF Export Functions
export async function exportToPDF(
  project: any,
  monthKey: string,
  enrichedRows: any[],
  monthLabelEs: (key: string, withYear?: boolean) => string
) {
  try {
    // Calculate how many rows fit per page (safe, bounded)
    // Prefer a stable cap; tune if design changes
    const DEFAULT_ROWS_PER_PAGE = 10; // estado anterior estable
    const rowsPerPage = Math.max(1, Math.min(DEFAULT_ROWS_PER_PAGE, enrichedRows.length || DEFAULT_ROWS_PER_PAGE));
    const totalPages = Math.ceil(enrichedRows.length / rowsPerPage) || 1;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    // Generate pages
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startRow = pageIndex * rowsPerPage;
      const endRow = Math.min(startRow + rowsPerPage, enrichedRows.length);
      const pageRows = enrichedRows.slice(startRow, endRow);
      
      // Generate HTML for this page
      const html = buildNominaMonthHTMLForPDF(project, monthKey, pageRows, monthLabelEs, pageIndex + 1, totalPages);
      
      // Create a temporary container for this page
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '297mm'; // A4 landscape width
      tempContainer.style.height = '210mm'; // A4 landscape height
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'hidden';
      
      // Add to DOM temporarily
      document.body.appendChild(tempContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Convert to canvas with fixed dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 3, // Higher quality for readability
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123, // 297mm at 96 DPI
        height: 794, // 210mm at 96 DPI
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Add new page if not the first page
      if (pageIndex > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF (full page)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    }
    
    // Generate filename
    const projectName = project?.nombre || 'Proyecto';
    const monthName = monthLabelEs(monthKey, true);
    const filename = `Nomina_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${monthName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Save PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

export function openPDFWindow(
  project: any,
  monthKey: string,
  enrichedRows: any[],
  monthLabelEs: (key: string, withYear?: boolean) => string
) {
  // For now, fallback to HTML print window
  // In the future, we could implement a PDF preview
  const html = buildNominaMonthHTML(project, monthKey, enrichedRows, monthLabelEs);
  openPrintWindow(html);
}


