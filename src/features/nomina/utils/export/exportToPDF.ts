import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportToPDFParams } from './types';
import { buildNominaMonthHTMLForPDF } from './buildNominaMonthHTMLForPDF';
import { getBlockFromRole } from './helpers';
import { calculatePagination } from './paginationHelpers';
import { generateNominaFilename } from './filenameHelpers';

export async function exportToPDF({
  project,
  monthKey,
  enrichedRows,
  monthLabelEs,
}: ExportToPDFParams): Promise<boolean> {
  if (!enrichedRows || !Array.isArray(enrichedRows)) {
    console.error('exportToPDF: enrichedRows no es un array válido', enrichedRows);
    return false;
  }
  
  console.log('🚀 exportToPDF called with', enrichedRows.length, 'rows');
  try {
    // Helper to check if a row is a refuerzo
    const isRefuerzo = (row: any): boolean => {
      const originalRole = (row as any)._originalRole || row.role || '';
      const role = String(originalRole).toUpperCase();
      return role.startsWith('REF') && role.length > 3;
    };
    
    // Group rows by blocks and separate refuerzos
    const rowsByBlock = {
      base: [] as any[],
      refuerzos: [] as any[],
      pre: [] as any[],
      pick: [] as any[],
    };
    
    enrichedRows.forEach(row => {
      if (isRefuerzo(row)) {
        rowsByBlock.refuerzos.push(row);
      } else {
        const block = getBlockFromRole(row.role);
        rowsByBlock[block].push(row);
      }
    });
    
    // Create a flat list of grouped rows with section titles
    const groupedRows: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
    
    // Equipo base (sin refuerzos)
    if (rowsByBlock.base.length > 0) {
      groupedRows.push({ type: 'title', block: 'base' });
      rowsByBlock.base.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    
    // Refuerzos (separados del equipo base)
    if (rowsByBlock.refuerzos.length > 0) {
      groupedRows.push({ type: 'title', block: 'refuerzos' });
      rowsByBlock.refuerzos.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    
    // Equipo prelight
    if (rowsByBlock.pre.length > 0) {
      groupedRows.push({ type: 'title', block: 'pre' });
      rowsByBlock.pre.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    
    // Equipo recogida
    if (rowsByBlock.pick.length > 0) {
      groupedRows.push({ type: 'title', block: 'pick' });
      rowsByBlock.pick.forEach(row => groupedRows.push({ type: 'row', row }));
    }
    
    // Calculate pagination
    const { pages, totalPages } = calculatePagination(groupedRows);
    
    console.log(`📄 Smart Pagination: ${groupedRows.length} grouped items (${enrichedRows.length} rows + section titles), ${totalPages} pages`);
    console.log(`📊 Pages breakdown:`, pages.map((p, i) => `Page ${i + 1}: ${p.length} items (${p.filter(x => x.type === 'title').length} titles, ${p.filter(x => x.type === 'row').length} rows)`));
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    // Generate pages using grouped rows
    console.log(`🔄 Starting PDF generation with ${totalPages} pages`);
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const pageGroupedItems = pages[pageIndex];
      console.log(`📄 Generating page ${pageIndex + 1}/${totalPages} with ${pageGroupedItems.length} items`);
      
      // Extract only the rows (not titles) for this page
      const pageRows = pageGroupedItems
        .filter(item => item.type === 'row')
        .map(item => item.row!);
      
      console.log(`   - Extracted ${pageRows.length} rows for this page`);
      
      // Generate HTML for this page
      const html = buildNominaMonthHTMLForPDF({
        project,
        monthKey,
        enrichedRows: pageRows,
        monthLabelEs,
        _currentPage: pageIndex + 1,
        _totalPages: totalPages,
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Convert to canvas with fixed dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        onclone: (clonedDoc) => {
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log('🔧 Footer styles applied in cloned document');
          } else {
            console.log('❌ Footer not found in cloned document');
          }
        }
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Add new page if not the first page
      if (pageIndex > 0) {
        console.log(`   - Adding new page to PDF`);
        pdf.addPage();
      }
      
      // Add image to PDF (full page)
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      console.log(`   - Page ${pageIndex + 1} added to PDF`);
    }
    
    console.log(`✅ PDF generation complete with ${totalPages} pages`);
    
    // Generate and save filename
    const filename = generateNominaFilename(project, monthKey, monthLabelEs);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

