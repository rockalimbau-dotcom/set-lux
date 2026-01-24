import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import i18n from '../../../../i18n/config';
import { Week, DayInfo } from './types';
import { buildPlanificacionHTMLForPDF } from './buildHTMLForPDF';
import { getFilenameTranslation } from './helpers';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

/**
 * Export single week to PDF
 */
export async function exportToPDF(
  project: any,
  weeks: Week[],
  DAYS: DayInfo[],
  parseYYYYMMDD: (dateStr: string) => Date,
  addDays: (date: Date, days: number) => Date
): Promise<void> {
  try {
    // Detect week type automatically for individual week PDF
    const weekType = weeks[0]?.label?.includes('-') ? 'pre' : weeks[0]?.label?.match(/\d+/) ? 'pro' : undefined;
    const html = buildPlanificacionHTMLForPDF(project, weeks, DAYS, parseYYYYMMDD, addDays, weekType);
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
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
          console.log('🔧 Planificación PDF: Footer styles applied in cloned document');
        } else {
          console.log('❌ Planificación PDF: Footer not found in cloned document');
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

    const projectName = project?.nombre || i18n.t('common.project');
    
    // Get planning label
    const planningLabel = i18n?.store?.data?.[i18n?.language || 'es']?.translation?.common?.planning || 
                          (i18n?.language === 'en' ? 'Planning' : i18n?.language === 'ca' ? 'Planificació' : 'Planificacion');
    
    // Extract week number from label
    const weekLabel = weeks[0]?.label || '';
    const weekMatch = weekLabel.match(/(Semana|Week|Setmana)\s*(-?\d+)/i);
    let weekPart = '';
    if (weekMatch) {
      const weekWord = weekMatch[1];
      const weekNumber = weekMatch[2];
      const weekWordTranslated = getFilenameTranslation('planning.week', weekWord);
      weekPart = `${weekWordTranslated}${weekNumber}`;
    } else {
      weekPart = weekLabel.replace(/\s+/g, '');
    }
    
    const filename = `${planningLabel}_${weekPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    await shareOrSavePDF(pdf, filename, i18n.t('planning.title'));
    console.log(`✅ Planificación PDF: Saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for planificación:', error);
    throw error;
  }
}

