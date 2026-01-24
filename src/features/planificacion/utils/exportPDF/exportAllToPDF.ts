import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../../i18n/config';
import { Week, DayInfo } from './types';
import { buildPlanificacionHTMLForPDF } from './buildHTMLForPDF';
import { getFilenameTranslation } from './helpers';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

/**
 * Export all weeks to PDF
 */
export async function exportAllToPDF(
  project: any,
  allWeeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date,
  scope?: 'pre' | 'pro'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < allWeeks.length; i++) {
      const week = allWeeks[i];
      // For PDF Entero (scope = undefined), detect week type automatically
      const weekType = scope === undefined 
        ? (week.label?.includes('-') ? 'pre' : week.label?.match(/\d+/) ? 'pro' : undefined)
        : scope;
      const weekHTML = buildPlanificacionHTMLForPDF(
        project,
        [week],
        DAYS,
        parseYYYYMMDD,
        addDays,
        weekType
      );

      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = weekHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px';
      document.body.appendChild(tempContainer);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: 794,
        ignoreElements: () => {
          return false;
        },
        onclone: (clonedDoc) => {
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log(`🔧 Planificación PDF All - Page ${i + 1}: Footer styles applied in cloned document`);
          } else {
            console.log(`❌ Planificación PDF All - Page ${i + 1}: Footer not found in cloned document`);
          }
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);

      console.log(`📄 Planificación PDF All: Page ${i + 1}/${allWeeks.length} generated`);
    }

    const projectName = project?.nombre || i18n.t('common.project');
    
    // Get planning label
    const planningLabel = i18n?.store?.data?.[i18n?.language || 'es']?.translation?.common?.planning || 
                          (i18n?.language === 'en' ? 'Planning' : i18n?.language === 'ca' ? 'Planificació' : 'Planificacion');
    
    // Determine scope label based on scope parameter
    let scopeLabel = '';
    if (scope === 'pre') {
      scopeLabel = getFilenameTranslation('planning.preproduction', 'Preproduccion');
    } else if (scope === 'pro') {
      scopeLabel = getFilenameTranslation('planning.production', 'Produccion');
    } else {
      scopeLabel = getFilenameTranslation('planning.complete', 'Completa');
    }
    
    const filename = `${planningLabel}_${scopeLabel}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    await shareOrSavePDF(pdf, filename, i18n.t('planning.title'));
    console.log(`✅ Planificación PDF All: ${allWeeks.length} pages saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for all planificación:', error);
    throw error;
  }
}

