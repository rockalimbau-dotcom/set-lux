// Utils to build exportable HTML for Nómina
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../i18n/config';

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
  // Helper function to generate worked days summary text for export
  const generateWorkedDaysText = (r: any): string => {
    const parts: string[] = [];
    
    // Orden: Localizar, Oficina, Carga, Rodaje, Descarga
    if ((r._localizar || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.location')} x${r._localizar}`);
    }
    
    if ((r._oficina || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.office')} x${r._oficina}`);
    }
    
    if ((r._carga || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.loading')} x${r._carga}`);
    }
    
    if ((r._rodaje || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.shooting')} x${r._rodaje}`);
    }
    
    if ((r._descarga || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.unloading')} x${r._descarga}`);
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    const totalWorked = r._worked || 0;
    return `<div style="text-align:center;"><strong>${totalWorked}</strong><br/><div style="font-size:10px;line-height:1.2;">${parts.join('<br/>')}</div></div>`;
  };

  // Helper function to generate dietas summary text for export
  const generateDietasText = (r: any): string => {
    const translateDietItem = (item: string): string => {
      const itemMap: Record<string, string> = {
        'Comida': i18n.t('payroll.dietOptions.lunch'),
        'Cena': i18n.t('payroll.dietOptions.dinner'),
        'Desayuno': i18n.t('payroll.dietOptions.breakfast'),
        'Dieta sin pernoctar': i18n.t('payroll.dietOptions.dietNoOvernight'),
        'Dieta completa + desayuno': i18n.t('payroll.dietOptions.dietFullBreakfast'),
        'Gastos de bolsillo': i18n.t('payroll.dietOptions.pocketExpenses'),
        'Ticket': i18n.t('payroll.dietOptions.ticket'),
      };
      return itemMap[item] || item;
    };
    
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
          parts.push(`${translateDietItem('Ticket')} €${r.ticketTotal.toFixed(2)}`);
          totalDietas += 1; // Contar ticket como 1 dieta
        }
      } else {
        const cnt = r.dietasCount?.get(label) || 0;
        if (cnt > 0) {
          parts.push(`${translateDietItem(label)} x${cnt}`);
          totalDietas += cnt;
        }
      }
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div style="text-align:center;"><strong>${totalDietas}</strong><br/>${parts.join(' ')}</div>`;
  };

  // Helper function to generate extras summary text for export
  const generateExtrasText = (r: any): string => {
    const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
    const parts: string[] = [];
    
    if ((r.horasExtra || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.extraHours')} x${r.horasExtra}</div>`);
    }
    
    if ((r.turnAround || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.turnAround')} x${r.turnAround}</div>`);
    }
    
    if ((r.nocturnidad || 0) > 0) {
      parts.push(`<div class="nocturnidad">${i18n.t('payroll.concepts.nightShift')} x${r.nocturnidad}</div>`);
    }
    
    if ((r.penaltyLunch || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.penaltyLunch')} x${r.penaltyLunch}</div>`);
    }
    
    if (parts.length === 0 || totalExtras === 0) {
      return '';
    }
    
    return `<div style="text-align:center;"><strong>${totalExtras}</strong><br/>${parts.join(' ')}</div>`;
  };

  // Helper function to display empty string for zero values in export
  const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === null || value === undefined || value === 0) return '';
    return decimals > 0 ? value.toFixed(decimals) : String(value);
  };

  // Helper function to display monetary values with € symbol (removes .00 if no decimals)
  const displayMoney = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === null || value === undefined || value === 0) return '';
    const formatted = value.toFixed(decimals);
    // Remove .00 if there are no meaningful decimals
    const cleaned = formatted.replace(/\.00$/, '');
    return `${cleaned}€`;
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
        `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.person')}</th>`,
        `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.workedDays')}</th>`,
        `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDays')}</th>`,
      ];

  if (columnVisibility.holidays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.holidayDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalHolidayDays')}</th>`);
  }

  if (columnVisibility.travel) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.travelDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTravelDays')}</th>`);
  }

  if (columnVisibility.extras) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.extraHours')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalExtraHours')}</th>`);
  }

  if (columnVisibility.dietas) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.dietas')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDietas')}</th>`);
  }

  if (columnVisibility.transporte) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.transportes')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTransportes')}</th>`);
  }

  if (columnVisibility.km) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.kilometraje')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalKilometraje')}</th>`);
  }

  headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalBruto')}</th>`);

  const head = `<tr>${headerCells.join('')}</tr>`;

  const body = enrichedRows
    .map(r => {

      const dataCells = [
        `<td class="text-left" style="font-weight:600;vertical-align:middle !important;">${esc(r.role)} — ${esc(r.name)}</td>`,
        `<td style="text-align:center !important;vertical-align:middle !important;">${generateWorkedDaysText(r) || esc(displayValue(r._worked))}</td>`,
        `<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDias, 2))}</td>`,
      ];

      if (columnVisibility.holidays) {
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._holidays))}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalHolidays, 2))}</td>`);
      }

      if (columnVisibility.travel) {
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._travel))}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTravel, 2))}</td>`);
      }

      if (columnVisibility.extras) {
        dataCells.push(`<td class="extras-cell" style="text-align:center !important;vertical-align:middle !important;">${generateExtrasText(r)}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalExtras, 2))}</td>`);
      }

      if (columnVisibility.dietas) {
        dataCells.push(`<td class="dietas-cell" style="text-align:center !important;vertical-align:middle !important;">${generateDietasText(r)}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDietas, 2))}</td>`);
      }

      if (columnVisibility.transporte) {
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.transporte))}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTrans, 2))}</td>`);
      }

      if (columnVisibility.km) {
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.km, 1))}</td>`);
        dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalKm, 2))}</td>`);
      }

      dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalBruto, 2))}</td>`);

      return `<tr>${dataCells.join('')}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || i18n.t('common.project'))} – ${i18n.t('payroll.payrollTitle')} ${esc(monthLabelEs(monthKey, true))}</title>
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
      background: #1e40af !important;
      color: white !important;
      padding: 8px 6px !important;
      text-align: center !important;
      vertical-align: middle !important;
      font-weight: 600 !important;
      font-size: 9px !important;
      text-transform: uppercase !important;
      border: 1px solid white !important;
      height: 40px !important;
      line-height: 1.2 !important;
      display: table-cell !important;
    }
    
    thead th {
      text-align: center !important;
      vertical-align: middle !important;
      height: 40px !important;
      line-height: 1.2 !important;
    }
    
    td {
      padding: 6px 6px;
      border: 1px solid #999;
      background: white;
      vertical-align: middle !important;
      text-align: center !important;
      color: #1e293b;
    }
    
    td.text-right {
      text-align: right !important;
    }
    
    td.text-left {
      text-align: left !important;
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
      <h1>${i18n.t('payroll.title')} - ${esc(monthLabelEs(monthKey, true))}</h1>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">${i18n.t('common.productionLabel')}</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${i18n.t('common.project')}</div>
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
      <span>${i18n.t('footer.generatedAutomaticallyBy')}</span>
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
  // Helper function to generate worked days summary text for export
  const generateWorkedDaysText = (r: any): string => {
    const parts: string[] = [];
    
    // Orden: Localizar, Oficina, Carga, Rodaje, Descarga
    if ((r._localizar || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.location')} x${r._localizar}`);
    }
    
    if ((r._oficina || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.office')} x${r._oficina}`);
    }
    
    if ((r._carga || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.loading')} x${r._carga}`);
    }
    
    if ((r._rodaje || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.shooting')} x${r._rodaje}`);
    }
    
    if ((r._descarga || 0) > 0) {
      parts.push(`${i18n.t('payroll.dayTypes.unloading')} x${r._descarga}`);
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    const totalWorked = r._worked || 0;
    return `<div style="text-align:center;"><strong>${totalWorked}</strong><br/><div style="font-size:10px;line-height:1.2;">${parts.join('<br/>')}</div></div>`;
  };

  // Helper function to generate dietas summary text for export
  const generateDietasText = (r: any): string => {
    const translateDietItem = (item: string): string => {
      const itemMap: Record<string, string> = {
        'Comida': i18n.t('payroll.dietOptions.lunch'),
        'Cena': i18n.t('payroll.dietOptions.dinner'),
        'Desayuno': i18n.t('payroll.dietOptions.breakfast'),
        'Dieta sin pernoctar': i18n.t('payroll.dietOptions.dietNoOvernight'),
        'Dieta completa + desayuno': i18n.t('payroll.dietOptions.dietFullBreakfast'),
        'Gastos de bolsillo': i18n.t('payroll.dietOptions.pocketExpenses'),
        'Ticket': i18n.t('payroll.dietOptions.ticket'),
      };
      return itemMap[item] || item;
    };
    
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
          parts.push(`${translateDietItem('Ticket')} €${r.ticketTotal.toFixed(2)}`);
          totalDietas += 1; // Contar ticket como 1 dieta
        }
      } else {
        const cnt = r.dietasCount?.get(label) || 0;
        if (cnt > 0) {
          parts.push(`${translateDietItem(label)} x${cnt}`);
          totalDietas += cnt;
        }
      }
    }
    
    if (parts.length === 0) {
      return '';
    }
    
    return `<div style="text-align:center;"><strong>${totalDietas}</strong><br/>${parts.join(' ')}</div>`;
  };

  // Helper function to generate extras summary text for export
  const generateExtrasText = (r: any): string => {
    const totalExtras = (r.horasExtra || 0) + (r.turnAround || 0) + (r.nocturnidad || 0) + (r.penaltyLunch || 0);
    const parts: string[] = [];
    
    if ((r.horasExtra || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.extraHours')} x${r.horasExtra}</div>`);
    }
    
    if ((r.turnAround || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.turnAround')} x${r.turnAround}</div>`);
    }
    
    if ((r.nocturnidad || 0) > 0) {
      parts.push(`<div class="nocturnidad">${i18n.t('payroll.concepts.nightShift')} x${r.nocturnidad}</div>`);
    }
    
    if ((r.penaltyLunch || 0) > 0) {
      parts.push(`<div>${i18n.t('payroll.concepts.penaltyLunch')} x${r.penaltyLunch}</div>`);
    }
    
    if (parts.length === 0 || totalExtras === 0) {
      return '';
    }
    
    return `<div style="text-align:center;"><strong>${totalExtras}</strong><br/>${parts.join(' ')}</div>`;
  };

  // Helper function to display empty string for zero values
  const displayValue = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === null || value === undefined || value === 0) return '';
    return decimals > 0 ? value.toFixed(decimals) : String(value);
  };

  // Helper function to display monetary values with € symbol (removes .00 if no decimals)
  const displayMoney = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === null || value === undefined || value === 0) return '';
    const formatted = value.toFixed(decimals);
    // Remove .00 if there are no meaningful decimals
    const cleaned = formatted.replace(/\.00$/, '');
    return `${cleaned}€`;
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
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.person')}</th>`,
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.workedDays')}</th>`,
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDays')}</th>`,
  ];

  if (columnVisibility.holidays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.holidayDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalHolidayDays')}</th>`);
  }

  if (columnVisibility.travel) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.travelDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTravelDays')}</th>`);
  }

  if (columnVisibility.extras) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.extraHours')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalExtraHours')}</th>`);
  }

  if (columnVisibility.dietas) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.dietas')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDietas')}</th>`);
  }

  if (columnVisibility.transporte) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.transportes')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTransportes')}</th>`);
  }

  if (columnVisibility.km) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.kilometraje')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalKilometraje')}</th>`);
  }

  headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalBruto')}</th>`);
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
      `<td class="text-left" style="font-weight:600;vertical-align:middle !important;">${esc(r.role)} — ${esc(r.name)}</td>`,
      `<td style="text-align:center !important;vertical-align:middle !important;">${generateWorkedDaysText(r) || esc(displayValue(r._worked))}</td>`,
      `<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDias, 2))}</td>`,
    ];

    if (columnVisibility.holidays) {
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._holidays))}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalHolidays, 2))}</td>`);
    }

    if (columnVisibility.travel) {
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._travel))}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTravel, 2))}</td>`);
    }

    if (columnVisibility.extras) {
      dataCells.push(`<td class="extras-cell" style="text-align:center !important;vertical-align:middle !important;">${generateExtrasText(r)}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalExtras, 2))}</td>`);
    }

    if (columnVisibility.dietas) {
      dataCells.push(`<td class="dietas-cell" style="text-align:center !important;vertical-align:middle !important;">${generateDietasText(r)}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDietas, 2))}</td>`);
    }

    if (columnVisibility.transporte) {
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.transporte))}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTrans, 2))}</td>`);
    }

    if (columnVisibility.km) {
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.km, 1))}</td>`);
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalKm, 2))}</td>`);
    }

    dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalBruto, 2))}</td>`);

    return `<tr>${dataCells.join('')}</tr>`;
  };

  // Generar body agrupado por bloques con títulos
  const bodyParts: string[] = [];
  const numColumns = headerCells.length;

  // Equipo base
  if (rowsByBlock.base.length > 0) {
    const baseTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:12px 8px;font-weight:700;background:#fff3e0;color:#e65100;text-align:center !important;vertical-align:middle !important;height:40px;line-height:1.2;display:table-cell;">
          ${i18n.t('payroll.teamBase')}
        </td>
      </tr>`;
    bodyParts.push(baseTitle);
    bodyParts.push(...rowsByBlock.base.map(generateRowHTML));
  }

  // Equipo Prelight
  if (rowsByBlock.pre.length > 0) {
    const preTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:12px 8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center !important;vertical-align:middle !important;height:40px;line-height:1.2;display:table-cell;">
          ${i18n.t('payroll.teamPrelight')}
        </td>
      </tr>`;
    bodyParts.push(preTitle);
    bodyParts.push(...rowsByBlock.pre.map(generateRowHTML));
  }

  // Equipo Recogida
  if (rowsByBlock.pick.length > 0) {
    const pickTitle = `
      <tr>
        <td colspan="${numColumns}" style="border:1px solid #999;padding:12px 8px;font-weight:700;background:#e3f2fd;color:#1565c0;text-align:center !important;vertical-align:middle !important;height:40px;line-height:1.2;display:table-cell;">
          ${i18n.t('payroll.teamPickup')}
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
  <title>${esc(project?.nombre || i18n.t('common.project'))} – ${i18n.t('payroll.payrollTitle')} ${esc(monthLabelEs(monthKey, true))}</title>
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
    
    .container-pdf {
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
      background: #1e40af !important;
      color: white !important;
      padding: 8px 6px !important;
      text-align: center !important;
      vertical-align: middle !important;
      font-weight: 600 !important;
      font-size: 9px !important;
      text-transform: uppercase !important;
      border: 1px solid white !important;
      height: 40px !important;
      line-height: 1.2 !important;
      display: table-cell !important;
    }
    
    thead th {
      text-align: center !important;
      vertical-align: middle !important;
      height: 40px !important;
      line-height: 1.2 !important;
    }
    
    td {
      padding: 6px 6px;
      border: 1px solid #999;
      background: white;
      vertical-align: middle !important;
      text-align: center !important;
      color: #1e293b;
    }
    
    td.text-right {
      text-align: right !important;
    }
    
    td.text-left {
      text-align: left !important;
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
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
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
    
    /* Ensure footer visibility in PDF */
    @media print {
      .footer { 
        position: fixed !important; 
        bottom: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        width: 100% !important; 
        background: white !important; 
        z-index: 9999 !important; 
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #64748b !important;
        font-size: 6px !important;
        padding: 6px 0 !important;
        border-top: 1px solid #e2e8f0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container-pdf">
    <div class="header">
      <h1>${i18n.t('payroll.title')} - ${esc(monthLabelEs(monthKey, true))}</h1>
    </div>
    
    <div class="content">
      <div class="info-panel">
        <div class="info-item">
          <div class="info-label">${i18n.t('common.productionLabel')}</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${i18n.t('common.project')}</div>
          <div class="info-value">${esc(project?.nombre || i18n.t('common.project'))}</div>
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
      <span>${i18n.t('footer.generatedBy')}</span>
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
  console.log('🚀 exportToPDF called with', enrichedRows.length, 'rows');
  try {
    // Group rows by blocks first to understand the structure
    const getBlockFromRole = (role: string) => {
      const roleUpper = String(role || '').toUpperCase();
      if (roleUpper.endsWith('P')) return 'pre';
      if (roleUpper.endsWith('R')) return 'pick';
      return 'base';
    };
    
    const rowsByBlock = {
      base: [] as any[],
      pre: [] as any[],
      pick: [] as any[],
    };
    
    enrichedRows.forEach(row => {
      const block = getBlockFromRole(row.role);
      rowsByBlock[block].push(row);
    });
    
    // Create a flat list of grouped rows with section titles
    const groupedRows: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
    
    if (rowsByBlock.base.length > 0) {
      groupedRows.push({ type: 'title', block: 'base' });
      rowsByBlock.base.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    if (rowsByBlock.pre.length > 0) {
      groupedRows.push({ type: 'title', block: 'pre' });
      rowsByBlock.pre.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    if (rowsByBlock.pick.length > 0) {
      groupedRows.push({ type: 'title', block: 'pick' });
      rowsByBlock.pick.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    
    // Smart pagination with auto-fill logic
    // More accurate height calculations based on actual rendered content
    const headerHeight = 90; // Header + info panel
    const footerHeight = 25; // Footer
    const tableHeaderHeight = 35; // Table headers
    const rowHeight = 28; // Height per row (accounts for padding and content)
    const sectionTitleHeight = 32; // Height per section title
    const maxPageHeight = 794; // Total page height (210mm at 96 DPI)
    const spaceBuffer = 20; // Buffer to maintain margins
    
    const baseHeight = headerHeight + footerHeight + tableHeaderHeight;
    const availableHeight = maxPageHeight - baseHeight;
    
    console.log(`📏 Height calculation: maxPage=${maxPageHeight}px, base=${baseHeight}px, available=${availableHeight}px`);
    
    // Calculate pages dynamically - each page can have different number of items
    const pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>> = [];
    let currentPage: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
    let currentHeight = 0;
    
    // Calculate max items per page (more aggressive)
    const maxItemsPerPage = Math.floor(availableHeight / Math.min(rowHeight, sectionTitleHeight));
    console.log(`📏 Max items per page calculation: ${maxItemsPerPage} items (available height: ${availableHeight}px)`);
    
    for (let i = 0; i < groupedRows.length; i++) {
      const item = groupedRows[i];
      const itemHeight = item.type === 'title' ? sectionTitleHeight : rowHeight;
      
      // If adding this item would exceed the page, start a new page
      if (currentHeight + itemHeight > availableHeight - spaceBuffer && currentPage.length > 0) {
        pages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }
      
      // Add item to current page
      currentPage.push(item);
      currentHeight += itemHeight;
      
      // Safety check: if we have too many items, force a new page
      if (currentPage.length >= maxItemsPerPage) {
        pages.push([...currentPage]);
        currentPage = [];
        currentHeight = 0;
      }
    }
    
    // Add the last page if it has items
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    // Force multiple pages if we have enough content
    if (pages.length === 1 && groupedRows.length > 10) {
      // Split into multiple pages more aggressively
      const itemsPerPage = Math.max(8, Math.floor(groupedRows.length / 2));
      pages.length = 0;
      for (let i = 0; i < groupedRows.length; i += itemsPerPage) {
        pages.push(groupedRows.slice(i, i + itemsPerPage));
      }
      console.log(`⚠️ Forced split into ${pages.length} pages`);
    }
    
    const totalPages = pages.length || 1;
    
    console.log(`📄 Smart Pagination: ${groupedRows.length} grouped items (${enrichedRows.length} rows + section titles), ${totalPages} pages`);
    console.log(`📊 Pages breakdown:`, pages.map((p, i) => `Page ${i + 1}: ${p.length} items (${p.filter(x => x.type === 'title').length} titles, ${p.filter(x => x.type === 'row').length} rows)`));
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    // Generate pages using grouped rows
    console.log(`🔄 Starting PDF generation with ${totalPages} pages`);
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageGroupedItems = pages[pageIndex];
      console.log(`📄 Generating page ${pageIndex + 1}/${totalPages} with ${pageGroupedItems.length} items`);
      
      // Extract only the rows (not titles) for this page
      const pageRows = pageGroupedItems
        .filter(item => item.type === 'row')
        .map(item => item.row!);
      
      console.log(`   - Extracted ${pageRows.length} rows for this page`);
      
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
        onclone: (clonedDoc) => {
          // Ensure footer is visible in cloned document
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log('🔧 Footer styles applied in cloned document');
          } else {
            console.log('❌ Footer not found in cloned document');
          }
        }
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Add new page if not the first page
      if (pageIndex > 0) {
        console.log(`   - Adding new page to PDF`);
        pdf.addPage();
      }
      
      // Add image to PDF (full page)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      console.log(`   - Page ${pageIndex + 1} added to PDF`);
    }
    
    console.log(`✅ PDF generation complete with ${totalPages} pages`);
    
    // Generate filename
    const projectName = project?.nombre || i18n.t('common.project');
    // Get translated "Nómina" label
    const currentLang = i18n?.language || 'es';
    let nominaLabel = 'Nómina';
    if (i18n?.store?.data?.[currentLang]?.translation?.payroll?.payrollTitle) {
      nominaLabel = i18n.store.data[currentLang].translation.payroll.payrollTitle;
    } else {
      if (currentLang === 'en') nominaLabel = 'Payroll';
      else if (currentLang === 'ca') nominaLabel = 'Nòmina';
    }
    
    // Extract month name from monthKey (format: "2025-01")
    let monthPart = '';
    try {
      const [year, month] = monthKey.split('-').map(Number);
      const dateObj = new Date(year, month - 1, 1);
      const monthName = dateObj.toLocaleDateString(currentLang, { month: 'long' });
      const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      monthPart = monthCapitalized.replace(/[^a-zA-Z0-9]/g, '');
    } catch (e) {
      // If extraction fails, use monthLabelEs
      const monthName = monthLabelEs(monthKey, true);
      monthPart = monthName.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    const filename = `${nominaLabel}_${monthPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
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


