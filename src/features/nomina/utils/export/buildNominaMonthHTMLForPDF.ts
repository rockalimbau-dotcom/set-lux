import i18n from '../../../../i18n/config';
import { BuildNominaMonthHTMLParams } from './types';
import { esc, getColumnVisibility, getBlockFromRole, sortRowsByRole } from './helpers';
import { generateHeaderCells, generateRowDataCells } from './tableHelpers';

export function buildNominaMonthHTMLForPDF({
  project,
  monthKey,
  enrichedRows,
  monthLabelEs,
}: BuildNominaMonthHTMLParams & { _currentPage?: number; _totalPages?: number }): string {
  const columnVisibility = getColumnVisibility(enrichedRows);
  const headerCells = generateHeaderCells(columnVisibility);
  const head = `<tr>${headerCells.join('')}</tr>`;

  // Group rows by block
  const rowsByBlock = {
    base: [] as any[],
    pre: [] as any[],
    pick: [] as any[],
  };

  enrichedRows.forEach(row => {
    const block = getBlockFromRole(row.role);
    rowsByBlock[block].push(row);
  });

  // Sort each block by role hierarchy
  rowsByBlock.base = sortRowsByRole(rowsByBlock.base, 'base');
  rowsByBlock.pre = sortRowsByRole(rowsByBlock.pre, 'pre');
  rowsByBlock.pick = sortRowsByRole(rowsByBlock.pick, 'pick');

  // Function to generate a row
  const generateRowHTML = (r: any) => {
    const dataCells = generateRowDataCells(r, columnVisibility);
    return `<tr>${dataCells.join('')}</tr>`;
  };

  // Generate body grouped by blocks with titles
  const bodyParts: string[] = [];
  const numColumns = headerCells.length;

  // Base team
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

  // Prelight team
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

  // Pickup team
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
      font-size: 11px;
    }
    
    .container-pdf {
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

