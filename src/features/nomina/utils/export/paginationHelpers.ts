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
  
  // Fixed heights (more conservative estimates)
  const headerHeight = 60; // Header with padding
  const infoPanelHeight = 50; // Info panel with margin
  const tableHeaderHeight = 40; // Table thead
  const footerHeight = 30; // Footer with padding
  const contentPadding = 24; // Top and bottom padding of content (12px * 2)
  
  // Variable heights
  const sectionTitleHeight = 40; // Section title row (more conservative)
  const baseRowHeight = 30; // Base row height (padding 6px * 2 + content)
  const rowWithContentHeight = 45; // Row with multi-line content (extras, dietas, etc.)
  
  // Calculate total fixed height
  const fixedHeight = headerHeight + infoPanelHeight + tableHeaderHeight + footerHeight + contentPadding;
  const availableHeight = maxPageHeight - fixedHeight;
  
  // Conservative buffer to ensure content doesn't overflow
  const safetyBuffer = 40;
  const usableHeight = availableHeight - safetyBuffer;
  
  const pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>> = [];
  let currentPage: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
  let currentHeight = 0;
  
  /**
   * Estimate row height based on content
   * Rows with extras, dietas, or worked days breakdown may be taller
   */
  const estimateRowHeight = (row: any): number => {
    // Check if row has complex content that might make it taller
    const hasExtras = row.extras && row.extras > 0;
    const hasDietas = row._totalDietas && row._totalDietas > 0;
    const hasWorkedBreakdown = row._rodaje || row._carga || row._descarga || row._localizar || row._oficina;
    
    if (hasExtras || hasDietas || hasWorkedBreakdown) {
      return rowWithContentHeight;
    }
    return baseRowHeight;
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

