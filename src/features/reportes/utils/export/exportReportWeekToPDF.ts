import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BuildPdfParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';
import { calculatePersonsPerPage } from './paginationHelpers';
import { generateWeekFilename } from './filenameHelpers';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

export async function exportReportWeekToPDF(params: BuildPdfParams) {
  const {
    project,
    title,
    safeSemana,
    dayNameFromISO,
    toDisplayDate,
    horarioTexto,
    CONCEPTS,
    data,
    filename,
  } = params;

  try {
    // Calculate pagination
    const personKeys = Object.keys(data || {});
    const totalPersons = personKeys.length;
    
    const { personsPerPage, totalPages } = calculatePersonsPerPage(totalPersons, CONCEPTS);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Generate pages
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startPerson = pageIndex * personsPerPage;
      const endPerson = Math.min(startPerson + personsPerPage, totalPersons);
      const pagePersonKeys = personKeys.slice(startPerson, endPerson);
      
      // Create data subset for this page
      const pageData: any = {};
      pagePersonKeys.forEach(pk => {
        pageData[pk] = data[pk];
      });
      
      // Generate HTML for this page
      const html = buildReportWeekHTMLForPDF({
        project,
        title,
        safeSemana,
        dayNameFromISO,
        toDisplayDate,
        horarioTexto,
        CONCEPTS,
        data: pageData,
      });
      
      // Create a temporary container for this page
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '297mm';
      tempContainer.style.height = '210mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'hidden';
      
      // Add to DOM temporarily
      document.body.appendChild(tempContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Convert to canvas with fixed dimensions (igual que nómina)
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
        ignoreElements: () => false,
        onclone: (clonedDoc) => {
          // Aplicar exactamente la misma lógica que en nómina
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
          }
        }
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Add new page if not the first page
      if (pageIndex > 0) {
        pdf.addPage();
      }
      
      // Add image to PDF with dynamic height
      const imgData = canvas.toDataURL('image/png');
      // Convertir altura de píxeles a mm y limitar a 210mm (altura máxima de A4 landscape)
      const imgHeightMM = (canvas.height / canvas.width) * 297;
      const maxPageHeightMM = 210;
      const imgHeight = Math.min(imgHeightMM, maxPageHeightMM);
      pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeight);
    }
    
    // Generate and save filename
    const fname = generateWeekFilename(project, title, filename);
    await shareOrSavePDF(pdf, fname, title);
    
    return true;
  } catch (error) {
    console.error('Error generating Report PDF:', error);
    return false;
  }
}

