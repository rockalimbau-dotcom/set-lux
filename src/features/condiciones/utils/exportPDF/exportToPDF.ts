import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../../i18n/config';
import { generateDynamicFestivosText } from '@shared/constants/festivos';
import {
  getDefaultAlojamiento,
  getDefaultPrepro,
  getDefaultConvenio,
} from '../translationHelpers';
import { renderWithParams, restoreStrongTags, markdownToHtml } from '../../condiciones/shared';
import { buildCondicionesPageHTMLForPDF } from './htmlBuilders';
import { getConditionsLabel, filterRolesWithPrices } from './helpers';

/**
 * Get translation helper
 */
function getTranslation(key: string, fallback: string): string {
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
}

/**
 * Export condiciones to PDF
 */
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

    // Generar festivos dinámicos en el idioma actual
    const currentFestivosText = await generateDynamicFestivosText();
    
    // Para el PDF, siempre usar los textos traducidos actuales para estos campos
    const festivosText = currentFestivosText;
    const alojamientoText = getDefaultAlojamiento();
    const preproText = getDefaultPrepro();
    const convenioText = getDefaultConvenio();

    // Calcular paginación con ajuste dinámico
    // Convertir Markdown a HTML para el PDF
    const blocks = [
      [i18n.t('conditions.legend'), markdownToHtml(restoreStrongTags(renderWithParams(model.legendTemplate, model.params)))],
      [i18n.t('conditions.holidays'), renderWithParams(festivosText, model.params)],
      [i18n.t('conditions.schedules'), markdownToHtml(restoreStrongTags(renderWithParams(model.horariosTemplate, model.params)))],
      [i18n.t('conditions.perDiems'), markdownToHtml(restoreStrongTags(renderWithParams(model.dietasTemplate, model.params)))],
      [i18n.t('conditions.transportation'), renderWithParams(model.transportesTemplate, model.params)],
      [i18n.t('conditions.accommodation'), renderWithParams(alojamientoText, model.params)],
      [i18n.t('conditions.preProduction'), renderWithParams(preproText, model.params)],
      [i18n.t('conditions.agreement'), renderWithParams(convenioText, model.params)],
    ].filter(([_, content]) => content.trim()); // Solo bloques con contenido

    const totalBlocks = blocks.length;
    const maxPageHeight = 1123; // Altura total de la página en píxeles (297mm)
    
    console.log(`🔧 Condiciones PDF: Total blocks: ${totalBlocks}`);
    
    // Procesar en páginas con detección dinámica de altura
    let currentBlockIndex = 0;
    let pageNumber = 0;
    let tablesIncluded = false; // Track si las tablas ya se incluyeron
    
    while (currentBlockIndex < totalBlocks || !tablesIncluded) {
      pageNumber++;
      const includeTables = !tablesIncluded;
      
      // Intentar añadir bloques hasta que no quepan más
      const pageBlocks: [string, string][] = [];
      
      // Añadir bloques mientras quepan
      while (currentBlockIndex < totalBlocks) {
        const testBlocks = [...pageBlocks, blocks[currentBlockIndex]];
        const testHTML = buildCondicionesPageHTMLForPDF(
          project,
          which,
          model,
          PRICE_HEADERS,
          PRICE_ROLES,
          testBlocks as [string, string][],
          includeTables
        );
        
        // Crear contenedor temporal para medir altura
        const testContainer = document.createElement('div');
        testContainer.innerHTML = testHTML;
        testContainer.style.position = 'absolute';
        testContainer.style.left = '-9999px';
        testContainer.style.top = '0';
        testContainer.style.width = '794px';
        testContainer.style.height = `${maxPageHeight}px`; // Altura fija de página
        testContainer.style.backgroundColor = 'white';
        testContainer.style.overflow = 'hidden'; // Hidden para detectar overflow
        document.body.appendChild(testContainer);
        
        // Esperar renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Medir altura del contenido
        const contentDiv = testContainer.querySelector('.content') as HTMLElement;
        const headerDiv = testContainer.querySelector('.header') as HTMLElement;
        const footerDiv = testContainer.querySelector('.footer') as HTMLElement;
        
        // Verificar si hay overflow: si scrollHeight > offsetHeight, el contenido no cabe
        const contentScrollHeight = contentDiv ? contentDiv.scrollHeight : 0;
        const contentOffsetHeight = contentDiv ? contentDiv.offsetHeight : 0;
        const hasOverflow = contentScrollHeight > contentOffsetHeight;
        
        // Calcular altura total
        const headerHeight = headerDiv ? headerDiv.offsetHeight : 0;
        const footerHeight = footerDiv ? footerDiv.offsetHeight : 0;
        const totalContentHeight = headerHeight + contentScrollHeight + footerHeight;
        
        document.body.removeChild(testContainer);
        
        // Si el contenido medido cabe en la página (sin overflow), añadir el bloque
        // Permitir un pequeño margen de error (10px)
        // Si es el primer bloque y no cabe, incluirlo de todas formas (página propia)
        const fitsInPage = !hasOverflow && totalContentHeight <= maxPageHeight + 10;
        
        if (fitsInPage || pageBlocks.length === 0) {
          pageBlocks.push(blocks[currentBlockIndex]);
          currentBlockIndex++;
        } else {
          // No cabe, parar y usar los bloques que ya tenemos
          break;
        }
      }
      
      // Si aún no incluimos las tablas y no hay más bloques, incluirlas ahora
      if (!tablesIncluded && currentBlockIndex >= totalBlocks) {
        // Las tablas irán en esta página o en la siguiente si no caben con los bloques actuales
        tablesIncluded = true;
      }
      
      // Si no hay bloques y ya incluimos las tablas, salir
      if (pageBlocks.length === 0 && tablesIncluded) {
        break;
      }
      
      console.log(`🔧 Condiciones PDF: Creating page ${pageNumber} with ${pageBlocks.length} blocks, tables: ${includeTables}`);
      
      // Crear HTML para esta página
      const pageHTML = buildCondicionesPageHTMLForPDF(
        project, 
        which, 
        model, 
        PRICE_HEADERS, 
        PRICE_ROLES, 
        pageBlocks,
        includeTables
      );
      
      // Si incluimos las tablas en esta página, marcarlas como incluidas
      if (includeTables) {
        tablesIncluded = true;
      }
      
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
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      
      if (pageNumber > 1) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // Vertical A4
    }

    const projectName = project?.nombre || 'Proyecto';
    
    // Traducir el tipo de condiciones
    let whichTranslated: string;
    if (which === 'semanal') {
      whichTranslated = getTranslation('common.weekly', 'semanal').toLowerCase();
    } else if (which === 'mensual') {
      whichTranslated = getTranslation('common.monthly', 'mensual').toLowerCase();
    } else if (which === 'diario') {
      whichTranslated = getTranslation('common.advertising', 'diario').toLowerCase();
    } else {
      whichTranslated = which;
    }
    
    const conditionsLabel = getConditionsLabel();
    const fileName = `${conditionsLabel}_${whichTranslated}_${projectName.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating condiciones PDF:', error);
    throw error;
  }
}

