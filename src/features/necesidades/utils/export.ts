import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export function buildNecesidadesHTML(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  const monday = parseYYYYMMDD(weekStart);
  
  const headerRow = DAYS.map(
    (_, i) =>
      `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
        ${esc(DAYS[i].name)}<br/>${esc(formatDDMM(addDays(monday, i)))}
      </th>`
  ).join('');

  const renderCell = (text: any): string =>
    `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;

  const fieldRow = (key: string, label: string): string => {
      const tds = DAYS.map(
        (_, i) =>
        `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${renderCell(valuesByDay[i]?.[key])}</td>`
      ).join('');
    return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
  };

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
      return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
    }).join('');
    return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
  };

  // Orden exacto como en la interfaz
  const body =
    fieldRow('loc', 'Localización') +
    fieldRow('seq', 'Secuencias') +
    listRow('Equipo técnico', 'crewList', 'crewTxt') +
    fieldRow('needLoc', 'Necesidades localizaciones') +
    fieldRow('needProd', 'Necesidades producción') +
    fieldRow('needLight', 'Necesidades luz') +
    fieldRow('extraMat', 'Material extra') +
    fieldRow('precall', 'Precall') +
    listRow('Equipo Prelight', 'preList', 'preTxt') +
    listRow('Equipo Recogida', 'pickList', 'pickTxt') +
    fieldRow('obs', 'Observaciones');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${esc(project?.nombre || 'Proyecto')} – Necesidades de Rodaje (${esc(weekLabel)})</title>
      <style>
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          font-size: 12px;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-bottom: 0;
          position: relative;
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
        
        .week-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 12px 0 8px 0;
          padding: 4px 0;
          border-bottom: 1px solid #e2e8f0;
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
          border: 2px solid #1e40af;
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
          border: 1px solid #e2e8f0;
          background: white;
          vertical-align: top;
          color: #1e293b;
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
          margin-bottom: 8px;
        }
        
        .setlux-logo { 
          font-weight: 700; 
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
          <h1>Necesidades - ${weekLabel.includes('-') ? 'Preproducción' : weekLabel.match(/\d+/) ? 'Producción' : 'Semana'}</h1>
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
          
          <div class="week-title">${esc(weekLabel)}</div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campo / Día</th>
                  ${headerRow}
                </tr>
              </thead>
              <tbody>
                ${body}
              </tbody>
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
    </html>
  `;
}

export function buildNecesidadesHTMLForPDF(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  const monday = parseYYYYMMDD(weekStart);
  
  const headerRow = DAYS.map(
    (_, i) =>
      `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1e40af;color:#fff;">
        ${esc(DAYS[i].name)}<br/>${esc(formatDDMM(addDays(monday, i)))}
      </th>`
  ).join('');

  const renderCell = (text: any): string =>
    `<div style="white-space:pre-wrap;line-height:1.35">${esc(text || '')}</div>`;

  const fieldRow = (key: string, label: string): string => {
    const tds = DAYS.map(
      (_, i) =>
        `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${renderCell(valuesByDay[i]?.[key])}</td>`
    ).join('');
    return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
  };

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
      return `<td style="border:1px solid #999;padding:6px;vertical-align:top;">${block}</td>`;
    }).join('');
    return `<tr><td style="border:1px solid #999;padding:6px;font-weight:600;background:#f8fafc;">${esc(label)}</td>${tds}</tr>`;
  };

  // Orden exacto como en la interfaz
  const body =
    fieldRow('loc', 'Localización') +
    fieldRow('seq', 'Secuencias') +
    listRow('Equipo técnico', 'crewList', 'crewTxt') +
    fieldRow('needLoc', 'Necesidades localizaciones') +
    fieldRow('needProd', 'Necesidades producción') +
    fieldRow('needLight', 'Necesidades luz') +
    fieldRow('extraMat', 'Material extra') +
    fieldRow('precall', 'Precall') +
    listRow('Equipo Prelight', 'preList', 'preTxt') +
    listRow('Equipo Recogida', 'pickList', 'pickTxt') +
    fieldRow('obs', 'Observaciones');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${esc(project?.nombre || 'Proyecto')} – Necesidades de Rodaje (${esc(weekLabel)})</title>
      <style>
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          font-size: 12px;
          margin: 0;
          padding: 0;
          background: white;
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
        }
        
        .info-value {
          font-size: 11px;
          color: #1e293b;
          font-weight: 500;
        }
        
        .week-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 12px 0 8px 0;
          padding: 4px 0;
          border-bottom: 1px solid #e2e8f0;
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
          border: 2px solid #1e40af;
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
          border: 1px solid #e2e8f0;
          background: white;
          vertical-align: top;
          color: #1e293b;
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
          }
        }
      </style>
    </head>
    <body>
      <div class="container-pdf">
        <div class="header">
          <h1>Necesidades - ${weekLabel.includes('-') ? 'Preproducción' : weekLabel.match(/\d+/) ? 'Producción' : 'Semana'}</h1>
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
          
          <div class="week-title">${esc(weekLabel)}</div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Campo / Día</th>
                  ${headerRow}
                </tr>
              </thead>
              <tbody>
                ${body}
              </tbody>
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
    </html>
  `;
}

export async function exportToPDF(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): Promise<void> {
  try {
    const html = buildNecesidadesHTMLForPDF(project, weekLabel, weekStart, valuesByDay);
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '297mm';
    tempContainer.style.height = '210mm';
    tempContainer.style.overflow = 'hidden';
    document.body.appendChild(tempContainer);

    // Debug: Check if footer exists and is visible
    const footer = tempContainer.querySelector('.footer') as HTMLElement;
    if (footer) {
      console.log(`📄 Necesidades PDF: Footer found, height: ${footer.offsetHeight}px, visible: ${footer.offsetHeight > 0}`);
      console.log(`📄 Necesidades PDF: Footer content:`, footer.textContent);
    } else {
      console.log(`❌ Necesidades PDF: Footer NOT found!`);
    }

    const canvas = await html2canvas(tempContainer, {
      scale: 3, // Higher quality for readability
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1123, // 297mm at 96 DPI
      height: 794, // 210mm at 96 DPI
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1123,
      windowHeight: 794, // 210mm at 96 DPI
      ignoreElements: () => {
        // Don't ignore footer elements
        return false;
      },
      onclone: (clonedDoc) => {
        // Ensure footer is visible in cloned document
        const footer = clonedDoc.querySelector('.footer') as HTMLElement;
        if (footer) {
          footer.style.position = 'relative';
          footer.style.display = 'flex';
          footer.style.visibility = 'visible';
          footer.style.opacity = '1';
          console.log('🔧 Necesidades PDF: Footer styles applied in cloned document');
        } else {
          console.log('❌ Necesidades PDF: Footer not found in cloned document');
        }
      }
    });

    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`Necesidades_${weekLabel.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Funciones legacy para compatibilidad
export function renderExportHTML(
  projectName: string,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[]
): string {
  return buildNecesidadesHTML({ nombre: projectName }, weekLabel, weekStart, valuesByDay);
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
    return buildNecesidadesHTML(
      { nombre: projectName },
      wk.label || 'Semana',
      wk.startDate || '',
      valuesByDay
    );
  });
  
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(projectName)} – Necesidades (todas)</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;">${parts.join('<hr style="page-break-after:always;border:none;border-top:1px solid #ddd;margin:24px 0;" />')}<footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer></body></html>`;
}

export async function exportAllToPDF(
  project: any,
  weekEntries: [string, WeekEntry][], 
  needs: NeedsData
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Process each week as a separate page
    for (let i = 0; i < weekEntries.length; i++) {
      const [wid, wk] = weekEntries[i];
      const valuesByDay = Array.from({ length: 7 }).map(
        (_, i) => needs[wid]?.days?.[i] || {}
      );

      // Create HTML for this week only
      const weekHTML = buildNecesidadesHTMLForPDF(
        project,
        wk.label || 'Semana',
        wk.startDate || '',
        valuesByDay
      );
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = weekHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px'; // 297mm at 96 DPI
      document.body.appendChild(tempContainer);

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 3, // Higher quality for readability
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123, // 297mm at 96 DPI
        height: 794, // 210mm at 96 DPI - fixed height for consistent pages
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: 794, // Fixed height for consistent pages
        ignoreElements: () => {
          // Don't ignore footer elements
          return false;
        },
        onclone: (clonedDoc) => {
          // Ensure footer visibility in cloned document
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log(`🔧 Necesidades PDF All - Page ${i + 1}: Footer styles applied in cloned document`);
          } else {
            console.log(`❌ Necesidades PDF All - Page ${i + 1}: Footer not found in cloned document`);
          }
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      
      // Add page to PDF (except for the first page which is already created)
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      
      console.log(`📄 Necesidades PDF All: Page ${i + 1}/${weekEntries.length} generated`);
    }
    
    // Generate filename
    const projectName = project?.nombre || 'Proyecto';
    const filename = `Necesidades_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Todas.pdf`;
    
    pdf.save(filename);
    console.log(`✅ Necesidades PDF All: ${weekEntries.length} pages saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for all needs:', error);
    throw error;
  }
}