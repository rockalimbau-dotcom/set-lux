import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import i18n from '../../../../i18n/config';
import { CustomRow, DayValues } from './types';
import { buildNecesidadesHTMLForPDF } from './htmlBuilders';
import { translateWeekLabel, getNeedsLabel } from './helpers';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

/**
 * Export single week to PDF
 */
export async function exportToPDF(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[],
  selectedRowKeys?: string[], // Filas seleccionadas para filtrar qué mostrar
  selectedDayIdxs?: number[], // Columnas seleccionadas (días)
  includeEmptyRows?: boolean, // Incluir filas vacías
  customRows?: CustomRow[]
): Promise<void> {
  try {
    const html = buildNecesidadesHTMLForPDF(
      project,
      weekLabel,
      weekStart,
      valuesByDay,
      selectedRowKeys,
      selectedDayIdxs,
      includeEmptyRows,
      customRows
    );
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1123px'; // A4 landscape width at 96 DPI
    tempContainer.style.height = '794px'; // A4 landscape height at 96 DPI
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
    
    // Generate translated filename
    const needsLabel = getNeedsLabel();
    const translatedWeekLabel = translateWeekLabel(weekLabel);
    const weekPart = translatedWeekLabel.replace(/\s+/g, '');
    const projectName = project?.nombre || i18n.t('needs.project');
    const filename = `${needsLabel}_${weekPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    await shareOrSavePDF(pdf, filename, needsLabel);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

