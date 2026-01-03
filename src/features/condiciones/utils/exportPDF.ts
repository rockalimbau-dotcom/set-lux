import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { renderWithParams, restoreStrongTags } from '../condiciones/shared';
import i18n from '../../../i18n/config';
import { generateDynamicFestivosText } from '@shared/constants/festivos';

// Función helper para traducir headers de precios
function translateHeader(header: string): string {
  const headerMap: Record<string, string> = {
    'Precio mensual': i18n.t('conditions.priceMonthly'),
    'Precio semanal': i18n.t('conditions.priceWeekly'),
    'Precio diario': i18n.t('conditions.priceDaily'),
    'Precio jornada': i18n.t('conditions.priceWorkDay'),
    'Precio refuerzo': i18n.t('conditions.priceReinforcement'),
    'Precio Día extra/Festivo': i18n.t('conditions.priceExtraDayHoliday'),
    'Travel day': i18n.t('conditions.travelDay'),
    'Horas extras': i18n.t('conditions.extraHours'),
    'Localización técnica': i18n.t('conditions.technicalLocation'),
    'Carga/descarga': i18n.t('conditions.loadingUnloading'),
  };
  return headerMap[header] || header;
}

// Función helper para traducir nombres de roles
function translateRoleName(roleName: string): string {
  // Mapeo de nombres de roles en español a códigos
  const roleNameToCode: Record<string, string> = {
    'Gaffer': 'G',
    'Best boy': 'BB',
    'Eléctrico': 'E',
    'Auxiliar': 'AUX',
    'Meritorio': 'M',
    'Técnico de mesa': 'TM',
    'Finger boy': 'FB',
    'Refuerzo': 'REF',
  };
  
  const roleCode = roleNameToCode[roleName];
  if (roleCode) {
    const translationKey = `team.roles.${roleCode}`;
    const translated = i18n.t(translationKey);
    // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
    return translated !== translationKey ? translated : roleName;
  }
  return roleName;
}

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
  const headerTitle = i18n.t('conditions.departmentTitle');

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
          <th>${i18n.t('conditions.rolePrice')}</th>
          ${PRICE_HEADERS.map(h => `<th>${esc(translateHeader(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(translateRoleName(role))}</td>
            ${PRICE_HEADERS.map(
              h => `<td>${esc(model.prices?.[role]?.[h] ?? '')}</td>`
            ).join('')}
          </tr>
        `
        ).join('')}
      </tbody>
    </table>`;

  const blocks = [
    [i18n.t('conditions.legend'), renderWithParams(model.legendTemplate, model.params)],
    [i18n.t('conditions.holidays'), renderWithParams(model.festivosTemplate, model.params)],
    [i18n.t('conditions.schedules'), renderWithParams(model.horariosTemplate, model.params)],
    [i18n.t('conditions.perDiems'), renderWithParams(model.dietasTemplate, model.params)],
    [i18n.t('conditions.transportation'), renderWithParams(model.transportesTemplate, model.params)],
    [i18n.t('conditions.accommodation'), renderWithParams(model.alojamientoTemplate, model.params)],
    [i18n.t('conditions.preProduction'), renderWithParams(model.preproTemplate, model.params)],
    [i18n.t('conditions.agreement'), renderWithParams(model.convenioTemplate, model.params)],
  ]
    .map(
      ([title, txt]) => `
      <section>
        <h4>${esc(title)}</h4>
        <div class="legend-content">${txt}</div>
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
    section .legend-content {
      white-space: pre-wrap;
      font-family: inherit;
      line-height: 1.4;
      font-size: 10px;
      color: #1e293b;
    }
    section .legend-content strong {
      font-weight: 700 !important;
      font-weight: bold !important;
      display: inline !important;
    }
    section .legend-content br {
      display: block;
      content: "";
      margin-top: 0.5em;
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
          <div class="info-label">${i18n.t('common.productionLabel')}</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${i18n.t('common.project')}</div>
          <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
        </div>
      </div>
      <div class="table-container">
        ${table}
      </div>
      ${blocks}
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
  const headerTitle = i18n.t('conditions.departmentTitle');

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
          <th>${i18n.t('conditions.rolePrice')}</th>
          ${PRICE_HEADERS.map(h => `<th>${esc(translateHeader(h))}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rolesConPrecios.map(
          role => `
          <tr>
            <td style="font-weight:600;">${esc(translateRoleName(role))}</td>
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
        <div class="legend-content">${txt}</div>
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
    section .legend-content {
      white-space: pre-wrap;
      font-family: inherit;
      line-height: 1.4;
      font-size: 10px;
      color: #1e293b;
    }
    section .legend-content strong {
      font-weight: 700 !important;
      font-weight: bold !important;
      display: inline !important;
    }
    section .legend-content br {
      display: block;
      content: "";
      margin-top: 0.5em;
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
          <div class="info-label">${i18n.t('common.productionLabel')}</div>
          <div class="info-value">${esc(project?.produccion || '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">${i18n.t('common.project')}</div>
          <div class="info-value">${esc(project?.nombre || 'Proyecto')}</div>
        </div>
      </div>
      <div class="table-container">
        ${table}
      </div>` : ''}
      ${blocks}
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

    // Obtener textos traducidos actuales para asegurar que estén en el idioma correcto del PDF
    // Estos textos siempre se mostrarán en el idioma actual, independientemente de lo que esté guardado
    const getDefaultAlojamiento = () => i18n.t('conditions.defaultAccommodation');
    const getDefaultPrepro = () => i18n.t('conditions.defaultPreProduction');
    const getDefaultConvenio = () => i18n.t('conditions.defaultAgreement');
    
    // Generar festivos dinámicos en el idioma actual
    const currentFestivosText = await generateDynamicFestivosText();
    
    // Para el PDF, siempre usar los textos traducidos actuales para estos campos
    // Esto asegura que el PDF siempre esté en el idioma seleccionado
    // Si el usuario ha personalizado estos textos, se usarán los traducidos actuales en el PDF
    const festivosText = currentFestivosText;
    const alojamientoText = getDefaultAlojamiento();
    const preproText = getDefaultPrepro();
    const convenioText = getDefaultConvenio();

    // Calcular paginación con ajuste dinámico (igual que reportes)
    const blocks = [
      [i18n.t('conditions.legend'), restoreStrongTags(renderWithParams(model.legendTemplate, model.params))],
      [i18n.t('conditions.holidays'), renderWithParams(festivosText, model.params)],
      [i18n.t('conditions.schedules'), restoreStrongTags(renderWithParams(model.horariosTemplate, model.params))],
      [i18n.t('conditions.perDiems'), restoreStrongTags(renderWithParams(model.dietasTemplate, model.params))],
      [i18n.t('conditions.transportation'), renderWithParams(model.transportesTemplate, model.params)],
      [i18n.t('conditions.accommodation'), renderWithParams(alojamientoText, model.params)],
      [i18n.t('conditions.preProduction'), renderWithParams(preproText, model.params)],
      [i18n.t('conditions.agreement'), renderWithParams(convenioText, model.params)],
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
      
      // Verificar que el HTML contiene los tags strong
      if (pageHTML.includes('<strong>')) {
        console.log('✅ HTML generado contiene tags <strong>');
      } else {
        console.log('❌ HTML generado NO contiene tags <strong>');
      }
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = pageHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // 210mm at 96 DPI (vertical)
      tempContainer.style.height = '1123px'; // 297mm at 96 DPI (vertical)
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);

      // Esperar a que el HTML se renderice completamente
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verificar y forzar el renderizado del HTML
      const legendDivs = tempContainer.querySelectorAll('.legend-content');
      legendDivs.forEach((div) => {
        const html = div.innerHTML;
        // Si el HTML contiene tags strong pero no se están renderizando, forzar renderizado
        if (html && html.includes('<strong>')) {
          const strongElements = div.querySelectorAll('strong');
          // Si no hay elementos strong en el DOM, significa que el HTML no se renderizó
          if (strongElements.length === 0) {
            // Forzar re-renderizado limpiando y reinsertando
            const temp = div.innerHTML;
            div.innerHTML = '';
            // Usar insertAdjacentHTML para forzar el renderizado
            div.insertAdjacentHTML('beforeend', temp);
          }
        }
      });
      
      // Esperar un poco más para que se renderice
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
        logging: true,
        onclone: (clonedDoc) => {
          // Asegurar que el HTML se renderice en el documento clonado
          const clonedLegendDivs = clonedDoc.querySelectorAll('.legend-content');
          clonedLegendDivs.forEach((div, idx) => {
            const html = div.innerHTML;
            console.log(`🔍 Clonado Div ${idx} - innerHTML:`, html.substring(0, 100));
            if (html && html.includes('<strong>')) {
              // Verificar si los elementos strong existen
              const strongElements = div.querySelectorAll('strong');
              console.log(`🔍 Clonado Div ${idx} - elementos strong encontrados: ${strongElements.length}`);
              if (strongElements.length === 0) {
                // Forzar renderizado en el documento clonado usando insertAdjacentHTML
                const temp = div.innerHTML;
                div.innerHTML = '';
                div.insertAdjacentHTML('beforeend', temp);
                console.log(`🔄 Clonado Div ${idx} - HTML re-renderizado`);
              } else {
                // Aplicar estilos directamente a los elementos strong
                strongElements.forEach(strong => {
                  (strong as HTMLElement).style.fontWeight = '700';
                  (strong as HTMLElement).style.display = 'inline';
                });
                console.log(`✅ Clonado Div ${idx} - Estilos aplicados a ${strongElements.length} elementos strong`);
              }
            }
          });
          
          // Aplicar estilos al footer también
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
        },
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
    
    // Helper para obtener traducción usando i18n.store
    const getTranslation = (key: string, fallback: string): string => {
      try {
        const currentLang = (i18n && i18n.language) ? i18n.language : 'es';
        
        // Intentar obtener la traducción desde i18n.store
        if (i18n?.store?.data && i18n.store.data[currentLang]?.translation) {
          const translations = i18n.store.data[currentLang].translation;
          
          // Obtener el valor anidado
          const keys = key.split('.');
          let value: any = translations;
          for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
              value = value[k];
            } else {
              break;
            }
          }
          
          if (typeof value === 'string' && value.trim() !== '') {
            return value;
          }
        }
        
        // Fallback: usar i18n.t() directamente
        const translated = i18n.t(key);
        if (translated && translated !== key) {
          return translated;
        }
        
        return fallback;
      } catch (error) {
        console.warn('Error in getTranslation:', error, 'key:', key);
        return fallback;
      }
    };
    
    // Traducir el tipo de condiciones
    let whichTranslated: string;
    if (which === 'semanal') {
      whichTranslated = getTranslation('common.weekly', 'semanal').toLowerCase();
    } else if (which === 'mensual') {
      whichTranslated = getTranslation('common.monthly', 'mensual').toLowerCase();
    } else if (which === 'publicidad') {
      whichTranslated = getTranslation('common.advertising', 'publicidad').toLowerCase();
    } else {
      whichTranslated = which;
    }
    
    // Traducir "Condiciones" - acceder directamente al store
    let conditionsLabel = 'Condiciones';
    try {
      const currentLang = i18n?.language || 'es';
      
      // Acceder directamente al store usando la estructura correcta
      if (i18n?.store?.data?.[currentLang]?.translation?.common?.conditions) {
        conditionsLabel = i18n.store.data[currentLang].translation.common.conditions;
      } else if (i18n?.store?.data?.[currentLang]?.common?.conditions) {
        // Intentar estructura alternativa
        conditionsLabel = i18n.store.data[currentLang].common.conditions;
      } else {
        // Fallback manual basado en el idioma
        if (currentLang === 'en') {
          conditionsLabel = 'Conditions';
        } else if (currentLang === 'ca') {
          conditionsLabel = 'Condicions';
        }
      }
    } catch (error) {
      console.warn('Error getting conditions label:', error);
    }
    
    const fileName = `${conditionsLabel}_${whichTranslated}_${projectName.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating condiciones PDF:', error);
    throw error;
  }
}
