// Utils to build exportable HTML for Nómina
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
    
    return `${totalDietas}<br/>${parts.join(' ')}`;
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
    
    if (parts.length === 0 || totalExtras === 0) {
      return '';
    }
    
    return `${totalExtras}<br/>${parts.join(' ')}`;
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

      const dataCells = [
        `<td class="text-left" style="font-weight:600;">${esc(r.role)} — ${esc(r.name)}</td>`,
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

      dataCells.push(`<td class="total-cell">${esc(displayValue(r._totalBruto, 2))}</td>`);

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
      padding: 12px 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 12px 20px;
      flex: 1;
      margin-bottom: 0;
    }
    
    .info-panel {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      display: flex;
      gap: 24px;
      align-items: center;
      justify-content: flex-start;
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
    }
    
    .info-value {
      font-size: 11px;
      color: #1e293b;
      font-weight: 500;
    }
    
    .table-container {
      background: white;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border: 2px solid #1e3a8a;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 6px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      border: 1px solid white;
    }
    
    td {
      padding: 6px 6px;
      border: 1px solid #999;
      background: white;
      vertical-align: top;
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
    
    .total-cell {
      font-weight: 700;
      font-size: 14px;
      color: #f97316;
    }
    
    .extras-cell, .dietas-cell {
      font-size: 10px;
    }
    
    .extras-cell br + *, .dietas-cell br + * {
      font-size: 10px !important;
    }
    
    .dietas-cell {
      font-size: 10px !important;
    }
    
    .dietas-cell br + * {
      font-size: 10px !important;
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
    
    return `${totalDietas}<br/>${parts.join(' ')}`;
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
    
    if (parts.length === 0 || totalExtras === 0) {
      return '';
    }
    
    return `${totalExtras}<br/>${parts.join(' ')}`;
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

  // Función para determinar el bloque basándose en el rol
  const getBlockFromRole = (role: string): 'base' | 'pre' | 'pick' => {
    const r = String(role).toUpperCase().trim();
    if (r.endsWith('P')) return 'pre';
    if (r.endsWith('R')) return 'pick';
    return 'base';
  };

  // Función para obtener prioridad del rol base (sin sufijo P/R)
  const getBaseRolePriority = (role: string): number => {
    const baseRole = role.replace(/[PR]$/, '').toUpperCase().trim();
    
    if (baseRole === 'G') return 0;
    if (baseRole === 'BB') return 1;
    if (baseRole === 'E') return 2;
    if (baseRole === 'TM') return 3;
    if (baseRole === 'FB') return 4;
    if (baseRole === 'AUX') return 5;
    if (baseRole === 'M') return 6;
    if (baseRole === 'REF') return 7;
    
    return 1000;
  };

  // Agrupar filas por bloque
  const rowsByBlock = {
    base: [] as any[],
    pre: [] as any[],
    pick: [] as any[],
  };

  enrichedRows.forEach(row => {
    const block = getBlockFromRole(row.role);
    rowsByBlock[block].push(row);
  });

  // Ordenar cada bloque por jerarquía de roles
  const sortRowsByRole = (rows: any[], block: 'base' | 'pre' | 'pick') => {
    return rows.sort((a, b) => {
      const roleA = String(a.role || '').toUpperCase();
      const roleB = String(b.role || '').toUpperCase();
      
      // Para bloques pre y pick, separar REF del resto
      if (block === 'pre' || block === 'pick') {
        const isRefA = roleA === 'REF';
        const isRefB = roleB === 'REF';
        
        // REF siempre al final dentro de su bloque
        if (isRefA && !isRefB) return 1;
        if (!isRefA && isRefB) return -1;
        
        // Si ambos son REF o ambos no son REF, ordenar por nombre
        if (isRefA && isRefB) {
          return String(a.name || '').localeCompare(String(b.name || ''));
        }
        
        // Ambos no son REF: ordenar por jerarquía del rol base
        const priorityA = getBaseRolePriority(roleA);
        const priorityB = getBaseRolePriority(roleB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      } else {
        // Para bloque base, ordenar por jerarquía normal
        const priorityA = getBaseRolePriority(roleA);
        const priorityB = getBaseRolePriority(roleB);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
      }
      
      // Si misma prioridad, ordenar por nombre
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  };

  rowsByBlock.base = sortRowsByRole(rowsByBlock.base, 'base');
  rowsByBlock.pre = sortRowsByRole(rowsByBlock.pre, 'pre');
  rowsByBlock.pick = sortRowsByRole(rowsByBlock.pick, 'pick');

  // Función para generar una fila
  const generateRowHTML = (r: any) => {
    const dataCells = [
      `<td class="text-left" style="font-weight:600;">${esc(r.role)} — ${esc(r.name)}</td>`,
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

    dataCells.push(`<td class="total-cell">${esc(displayValue(r._totalBruto, 2))}</td>`);

    return `<tr>${dataCells.join('')}</tr>`;
  };

  // Generar body agrupado por bloques con títulos
  const bodyParts: string[] = [];
  const numColumns = headerCells.length;

  // Equipo base
  if (rowsByBlock.base.length > 0) {
    const baseTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:8px;font-weight:700;background:#fff3e0;color:#e65100;text-align:center;">
          EQUIPO BASE
        </td>
      </tr>`;
    bodyParts.push(baseTitle);
    bodyParts.push(...rowsByBlock.base.map(generateRowHTML));
  }

  // Equipo Prelight
  if (rowsByBlock.pre.length > 0) {
    const preTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center;">
          EQUIPO PRELIGHT
        </td>
      </tr>`;
    bodyParts.push(preTitle);
    bodyParts.push(...rowsByBlock.pre.map(generateRowHTML));
  }

  // Equipo Recogida
  if (rowsByBlock.pick.length > 0) {
    const pickTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center;">
          EQUIPO RECOGIDA
        </td>
      </tr>`;
    bodyParts.push(pickTitle);
    bodyParts.push(...rowsByBlock.pick.map(generateRowHTML));
  }

  const body = bodyParts.join('');

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
      padding: 12px 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .header h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .content {
      padding: 12px 20px;
      flex: 1;
      margin-bottom: 0;
    }
    
    .info-panel {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      display: flex;
      gap: 24px;
      align-items: center;
      justify-content: flex-start;
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
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border: 2px solid #1e3a8a;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 6px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      border: 1px solid white;
    }
    
    td {
      padding: 6px 6px;
      border: 1px solid #999;
      background: white;
      vertical-align: top;
      color: #1e293b;
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
    
    .total-cell {
      font-weight: 700;
      font-size: 12px;
      color: #f97316;
    }
    
    .extras-cell, .dietas-cell {
      font-size: 9px;
    }
    
    .extras-cell br + *, .dietas-cell br + * {
      font-size: 9px !important;
    }
    
    .dietas-cell {
      font-size: 9px !important;
    }
    
    .dietas-cell br + * {
      font-size: 9px !important;
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
    // Smart pagination with auto-fill logic (copied from reportes)
    const totalRows = enrichedRows.length;
    
    // Smart pagination with auto-fill logic
    const estimateContentHeight = (numRows: number) => {
      const headerHeight = 80; // Header + info panel
      const footerHeight = 25; // Footer (same as reportes)
      const tableHeaderHeight = 40; // Table headers
      const rowHeight = 25; // Height per row
      
      const totalRowsHeight = numRows * rowHeight;
      return headerHeight + footerHeight + tableHeaderHeight + totalRowsHeight;
    };
    
    // Smart pagination: start aggressive and adjust dynamically
    let rowsPerPage = Math.min(25, totalRows); // Start more aggressive
    const maxPageHeight = 720; // Available height for content (more space for content)
    const minRowsPerPage = 1; // Minimum to prevent infinite loops
    
    // Dynamic adjustment
    while (estimateContentHeight(rowsPerPage) > maxPageHeight && rowsPerPage > minRowsPerPage) {
      rowsPerPage--;
    }
    
    // Auto-fill logic: if we have space, try to add more rows
    let optimalRowsPerPage = rowsPerPage;
    const spaceBuffer = 20; // Buffer to maintain nice margins
    
    for (let testRows = rowsPerPage + 1; testRows <= totalRows; testRows++) {
      const testHeight = estimateContentHeight(testRows);
      const availableSpace = maxPageHeight - testHeight;
      
      if (testHeight <= maxPageHeight && availableSpace >= spaceBuffer) {
        optimalRowsPerPage = testRows;
        console.log(`🎯 Auto-fill: Can fit ${testRows} rows (height: ${testHeight}px, space left: ${availableSpace}px)`);
      } else if (testHeight <= maxPageHeight && availableSpace < spaceBuffer) {
        // We can fit it but would be too tight, stop here
        console.log(`⚠️ Auto-fill: ${testRows} rows would fit but too tight (space left: ${availableSpace}px < ${spaceBuffer}px buffer)`);
        break;
      } else {
        // Would exceed page height
        console.log(`❌ Auto-fill: ${testRows} rows would exceed page height (${testHeight}px > ${maxPageHeight}px)`);
        break;
      }
    }
    
    rowsPerPage = optimalRowsPerPage;
    let totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
    
    // Additional optimization: aggressive mode for better space utilization
    const aggressiveMaxHeight = 800; // More space for aggressive mode
    let aggressiveRowsPerPage = rowsPerPage;
    
    for (let testRows = rowsPerPage + 1; testRows <= totalRows; testRows++) {
      const testHeight = estimateContentHeight(testRows);
      if (testHeight <= aggressiveMaxHeight) {
        aggressiveRowsPerPage = testRows;
        console.log(`🚀 Aggressive mode: Can fit ${testRows} rows (height: ${testHeight}px)`);
      } else {
        break;
      }
    }
    
    if (aggressiveRowsPerPage > rowsPerPage) {
      rowsPerPage = aggressiveRowsPerPage;
      totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
      console.log(`🚀 Applied aggressive optimization: ${rowsPerPage} rows per page`);
    }
    
    console.log(`📄 Smart Pagination: ${totalRows} rows, ${rowsPerPage} per page, ${totalPages} pages`);
    console.log(`📏 Final height for ${rowsPerPage} rows: ${estimateContentHeight(rowsPerPage)}px`);
    
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


