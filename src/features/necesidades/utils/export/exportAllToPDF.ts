import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import i18n from '../../../../i18n/config';
import { WeekEntry, NeedsData } from './types';
import { buildNecesidadesHTMLForPDF } from './htmlBuilders';
import { getNeedsLabel, getCompleteLabel } from './helpers';

/**
 * Export all weeks to PDF
 */
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
        wk.label || i18n.t('needs.week'),
        wk.startDate || '',
        valuesByDay
      );
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = weekHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px'; // A4 landscape width at 96 DPI
      tempContainer.style.height = '794px'; // A4 landscape height at 96 DPI
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
    const projectName = project?.nombre || i18n.t('needs.project');
    const needsLabel = getNeedsLabel();
    const completeLabel = getCompleteLabel();
    const filename = `${needsLabel}_${completeLabel}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    pdf.save(filename);
    console.log(`✅ Necesidades PDF All: ${weekEntries.length} pages saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for all needs:', error);
    throw error;
  }
}

