import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { renderWithParams } from '../condiciones/shared';

// Función para construir HTML para PDF de condiciones
export function buildCondicionesHTMLForPDF(
  project: any,
  which: string,
  model: any,
  PRICE_HEADERS: string[],
  PRICE_ROLES: string[]
): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  // Título genérico para todas las condiciones
  const headerTitle = 'Condiciones Departamento Iluminación';

  // Filtrar roles que tengan al menos un precio no vacío
  const rolesConPrecios = PRICE_ROLES.filter(role => {
    return PRICE_HEADERS.some(header => {
      const precio = model.prices?.[role]?.[header];
      return precio && precio.toString().trim() !== '';
    });
  });

  const table = `
    <table>
      <thead>
        <tr>
          <th>Ro l/ Precio</th>
          ${PRICE_HEADERS.map(h => `<th>${esc(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(role)}</td>
            ${PRICE_HEADERS.map(
              h => `<td>${esc(model.prices?.[role]?.[h] ?? '')}</td>`
            ).join('')}
          </tr>
        `
        ).join('')}
      </tbody>
    </table>`;

  const blocks = [
    ['Leyenda cálculos', renderWithParams(model.legendTemplate, model.params)],
    ['Festivos', renderWithParams(model.festivosTemplate, model.params)],
    ['Horarios', renderWithParams(model.horariosTemplate, model.params)],
    ['Dietas', renderWithParams(model.dietasTemplate, model.params)],
    ['Transportes', renderWithParams(model.transportesTemplate, model.params)],
    ['Alojamiento', renderWithParams(model.alojamientoTemplate, model.params)],
    ['Pre producción', renderWithParams(model.preproTemplate, model.params)],
    ['Convenio', renderWithParams(model.convenioTemplate, model.params)],
  ]
    .map(
      ([title, txt]) => `
      <section>
        <h4>${esc(title)}</h4>
        <pre>${esc(txt)}</pre>
      </section>`
    )
    .join('');


  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – ${esc(headerTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
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
      margin-bottom: 15px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 10px; 
      border: 2px solid #1e3a8a; 
    }
    th { 
      background: #1e3a8a; 
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
    section {
      background: white;
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    section h4 {
      color: #1e3a8a;
      font-weight: 700;
      margin-bottom: 8px;
      font-size: 12px;
    }
    section pre {
      white-space: pre-wrap;
      font-family: inherit;
      line-height: 1.4;
      font-size: 10px;
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
    .setlux-logo { font-weight: 700; }
    .setlux-logo .set { color: #f97316; }
    .setlux-logo .lux { color: #3b82f6; }
    
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
  <div class="container">
    <div class="header">
      <h1>${esc(headerTitle)}</h1>
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
        ${table}
      </div>
      ${blocks}
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

// Función para crear HTML de páginas individuales con paginación inteligente
function buildCondicionesPageHTMLForPDF(
  project: any,
  which: string,
  model: any,
  PRICE_HEADERS: string[],
  PRICE_ROLES: string[],
  pageBlocks: [string, string][],
  includeHeader: boolean = true
): string {
  const esc = (s: any): string =>
    String(s ?? '').replace(
      /[&<>]/g,
      (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] || c
    );

  // Título genérico para todas las condiciones
  const headerTitle = 'Condiciones Departamento Iluminación';

  // Filtrar roles que tengan al menos un precio no vacío
  const rolesConPrecios = PRICE_ROLES.filter(role => {
    return PRICE_HEADERS.some(header => {
      const precio = model.prices?.[role]?.[header];
      return precio && precio.toString().trim() !== '';
    });
  });

  const table = includeHeader ? `
    <table>
      <thead>
        <tr>
          <th>Ro l/ Precio</th>
          ${PRICE_HEADERS.map(h => `<th>${esc(h)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(role)}</td>
            ${PRICE_HEADERS.map(
              h => `<td>${esc(model.prices?.[role]?.[h] ?? '')}</td>`
            ).join('')}
          </tr>
        `
        ).join('')}
      </tbody>
    </table>` : '';

  const blocks = pageBlocks
    .map(
      ([title, txt]) => `
      <section>
        <h4>${esc(title)}</h4>
        <pre>${esc(txt)}</pre>
      </section>`
    )
    .join('');

  // Sin sección de firmas

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(project?.nombre || 'Proyecto')} – ${esc(headerTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.3;
      font-size: 12px;
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
      margin-bottom: 15px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 10px; 
      border: 2px solid #1e3a8a; 
    }
    th { 
      background: #1e3a8a; 
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
    section {
      background: white;
      border-radius: 6px;
      padding: 12px;
      margin: 10px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    section h4 {
      color: #1e3a8a;
      font-weight: 700;
      margin-bottom: 8px;
      font-size: 12px;
    }
    section pre {
      white-space: pre-wrap;
      font-family: inherit;
      line-height: 1.4;
      font-size: 10px;
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
    .setlux-logo { font-weight: 700; }
    .setlux-logo .set { color: #f97316; }
    .setlux-logo .lux { color: #3b82f6; }
    
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
  <div class="container">
    <div class="header">
      <h1>${esc(headerTitle)}</h1>
    </div>
    <div class="content">
      ${includeHeader ? `
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
        ${table}
      </div>` : ''}
      ${blocks}
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

// Función para exportar condiciones a PDF (orientación vertical)
export async function exportCondicionesToPDF(
  project: any,
  which: string,
  model: any,
  PRICE_HEADERS: string[],
  PRICE_ROLES: string[]
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait', // Vertical como solicitaste
      unit: 'mm',
      format: 'a4'
    });

    // Calcular paginación con ajuste dinámico (igual que reportes)
    const blocks = [
      ['Leyenda cálculos', renderWithParams(model.legendTemplate, model.params)],
      ['Festivos', renderWithParams(model.festivosTemplate, model.params)],
      ['Horarios', renderWithParams(model.horariosTemplate, model.params)],
      ['Dietas', renderWithParams(model.dietasTemplate, model.params)],
      ['Transportes', renderWithParams(model.transportesTemplate, model.params)],
      ['Alojamiento', renderWithParams(model.alojamientoTemplate, model.params)],
      ['Pre producción', renderWithParams(model.preproTemplate, model.params)],
      ['Convenio', renderWithParams(model.convenioTemplate, model.params)],
    ].filter(([_, content]) => content.trim()); // Solo bloques con contenido

    const totalBlocks = blocks.length;
    
    // Smart pagination con lógica de auto-ajuste (igual que reportes)
    const estimateContentHeight = (numBlocks: number) => {
      const headerHeight = 120; // Header + info panel + tabla (más conservador)
      const footerHeight = 30; // Footer (más espacio)
      const sectionHeight = 80; // Altura promedio por sección de texto (más conservador)
      
      return headerHeight + footerHeight + (numBlocks * sectionHeight);
    };
    
    // Smart pagination: empezar conservador y ajustar dinámicamente
    let blocksPerPage = Math.min(4, totalBlocks); // Máximo 4 secciones por página (más conservador)
    const maxPageHeight = 600; // Altura disponible para contenido (más conservador)
    const minBlocksPerPage = 1; // Mínimo para prevenir bucles infinitos
    
    // Ajuste dinámico
    while (estimateContentHeight(blocksPerPage) > maxPageHeight && blocksPerPage > minBlocksPerPage) {
      blocksPerPage--;
    }
    
    // Lógica de auto-llenado: si tenemos espacio, intentar agregar más bloques
    let optimalBlocksPerPage = blocksPerPage;
    const spaceBuffer = 50; // Buffer para mantener márgenes bonitos (más conservador)
    
    for (let testBlocks = blocksPerPage + 1; testBlocks <= totalBlocks; testBlocks++) {
      const testHeight = estimateContentHeight(testBlocks);
      const availableSpace = maxPageHeight - testHeight;
      
      if (availableSpace >= spaceBuffer) {
        optimalBlocksPerPage = testBlocks;
      } else {
        break;
      }
    }
    
    blocksPerPage = optimalBlocksPerPage;
    
    console.log(`🔧 Condiciones PDF: Total blocks: ${totalBlocks}, Blocks per page: ${blocksPerPage}`);
    
    // Procesar en páginas
    for (let i = 0; i < totalBlocks; i += blocksPerPage) {
      const pageBlocks = blocks.slice(i, i + blocksPerPage) as [string, string][];
      const pageNumber = Math.floor(i / blocksPerPage) + 1;
      
      console.log(`🔧 Condiciones PDF: Creating page ${pageNumber} with ${pageBlocks.length} blocks:`, pageBlocks.map(([title]) => title));
      
      // Crear HTML para esta página
      const pageHTML = buildCondicionesPageHTMLForPDF(
        project, 
        which, 
        model, 
        PRICE_HEADERS, 
        PRICE_ROLES, 
        pageBlocks,
        i === 0 // Primera página incluye header y tabla
      );
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = pageHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // 210mm at 96 DPI (vertical)
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI (vertical)
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        ignoreElements: () => false,
        onclone: (clonedDoc) => {
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log('🔧 Condiciones PDF: Footer styles applied in cloned document');
          } else {
            console.log('❌ Condiciones PDF: Footer not found in cloned document');
          }
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // Vertical A4
    }

    const projectName = project?.nombre || 'Proyecto';
    const fileName = `Condiciones_${which}_${projectName.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating condiciones PDF:', error);
    throw error;
  }
}
