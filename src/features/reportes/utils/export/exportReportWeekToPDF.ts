import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BuildPdfParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';
import { calculatePersonsPerPage } from './paginationHelpers';
import { generateWeekFilename } from './filenameHelpers';

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
      tempContainer.style.width = '1123px';
      tempContainer.style.height = 'auto';
      tempContainer.style.minHeight = '794px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.overflow = 'visible';
      
      // Add to DOM temporarily
      document.body.appendChild(tempContainer);
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Debug: Check if footer exists and is visible
      const footer = tempContainer.querySelector('.footer') as HTMLElement;
      if (footer) {
      } else {
      }
      
      // Convert to canvas with dynamic height to include footer
      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: tempContainer.scrollHeight + 100,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: tempContainer.scrollHeight + 100,
        ignoreElements: () => false,
        onclone: (clonedDoc) => {
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
          } else {
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
      const imgHeight = (canvas.height / canvas.width) * 297;
      pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeight);
    }
    
    // Generate and save filename
    const fname = generateWeekFilename(project, title, filename);
    pdf.save(fname);
    
    return true;
  } catch (error) {
    console.error('Error generating Report PDF:', error);
    return false;
  }
}

