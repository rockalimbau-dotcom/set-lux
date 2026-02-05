/**
 * Calculate pagination for PDF export
 * Improved version that more accurately detects when content doesn't fit
 */
interface PaginationResult {
  pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>>;
  totalPages: number;
}

export const calculatePagination = (
  groupedRows: Array<{ type: 'title' | 'row', block?: string, row?: any }>
): PaginationResult => {
  // Heights in pixels (1123x794px = A4 landscape at 3x scale)
  const maxPageHeight = 794;
  
  // Fixed heights (extra conservative to avoid footer overlap)
  const headerHeight = 70; // Header with padding
  const infoPanelHeight = 60; // Info panel with margin
  const tableHeaderHeight = 44; // Table thead
  const footerHeight = 40; // Footer with padding
  const contentPadding = 28; // Top and bottom padding of content
  
  // Variable heights
  const sectionTitleHeight = 44; // Section title row
  const baseRowHeight = 26; // Base row height (single line)
  const lineHeight = 12; // Approx line height for multi-line cells
  
  // Calculate total fixed height
  const fixedHeight = headerHeight + infoPanelHeight + tableHeaderHeight + footerHeight + contentPadding;
  const availableHeight = maxPageHeight - fixedHeight;
  
  // Extra buffer to ensure a bottom limit before the footer
  const safetyBuffer = 80;
  const usableHeight = Math.max(availableHeight - safetyBuffer, 200);
  
  const pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>> = [];
  let currentPage: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
  let currentHeight = 0;
  
  /**
   * Estimate row height based on content
   * Rows with extras, dietas, or worked days breakdown may be taller
   */
  const estimateRowHeight = (row: any): number => {
    const workedParts = [
      row._localizar,
      row._oficina,
      row._carga,
      row._rodaje,
      row._prelight,
      row._recogida,
      row._descarga,
    ].filter(val => (val || 0) > 0).length;
    const workedLines = workedParts > 0 ? 1 + workedParts : 1;
    
    const cargaDescargaParts = [row._cargaDays, row._descargaDays].filter(val => (val || 0) > 0).length;
    const cargaDescargaLines = cargaDescargaParts > 0 ? 1 + cargaDescargaParts : 1;
    
    const extrasParts = [
      row.horasExtra,
      row.turnAround,
      row.nocturnidad,
      row.penaltyLunch,
    ].filter(val => (val || 0) > 0).length;
    const extrasLines = extrasParts > 0 ? 1 + extrasParts : 1;
    
    const hasDietas =
      (row._totalDietas || 0) > 0 ||
      (row.ticketTotal || 0) > 0 ||
      (row.otherTotal || 0) > 0 ||
      (row.dietasCount && row.dietasCount.size > 0);
    const dietasLines = hasDietas ? 2 : 1;
    
    const maxLines = Math.max(workedLines, cargaDescargaLines, extrasLines, dietasLines, 1);
    return baseRowHeight + (maxLines - 1) * lineHeight;
  };
  
  for (let i = 0; i < groupedRows.length; i++) {
    const item = groupedRows[i];
    const itemHeight = item.type === 'title' 
      ? sectionTitleHeight 
      : estimateRowHeight(item.row);
    
    // Check if adding this item would exceed available space
    // If so, start a new page (but only if we already have items on current page)
    if (currentHeight + itemHeight > usableHeight && currentPage.length > 0) {
      pages.push([...currentPage]);
      currentPage = [];
      currentHeight = 0;
    }
    
    // Add item to current page
    currentPage.push(item);
    currentHeight += itemHeight;
    
    // Safety check: if we're getting close to the limit, be more conservative
    if (currentHeight > usableHeight * 0.9 && currentPage.length > 1) {
      // Remove last item and start new page
      const lastItem = currentPage.pop();
      if (lastItem) {
        pages.push([...currentPage]);
        currentPage = [lastItem];
        currentHeight = itemHeight;
      }
    }
  }
  
  // Add remaining items as last page
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  // Ensure we have at least one page
  if (pages.length === 0) {
    pages.push([]);
  }
  
  const totalPages = pages.length;
  
  return { pages, totalPages };
};
