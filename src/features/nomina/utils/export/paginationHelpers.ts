/**
 * Calculate pagination for PDF export
 */
export interface PaginationResult {
  pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>>;
  totalPages: number;
}

export const calculatePagination = (
  groupedRows: Array<{ type: 'title' | 'row', block?: string, row?: any }>
): PaginationResult => {
  const headerHeight = 90;
  const footerHeight = 25;
  const tableHeaderHeight = 35;
  const rowHeight = 28;
  const sectionTitleHeight = 32;
  const maxPageHeight = 794;
  const spaceBuffer = 20;
  
  const baseHeight = headerHeight + footerHeight + tableHeaderHeight;
  const availableHeight = maxPageHeight - baseHeight;
  
  const pages: Array<Array<{ type: 'title' | 'row', block?: string, row?: any }>> = [];
  let currentPage: Array<{ type: 'title' | 'row', block?: string, row?: any }> = [];
  let currentHeight = 0;
  
  const maxItemsPerPage = Math.floor(availableHeight / Math.min(rowHeight, sectionTitleHeight));
  
  for (let i = 0; i < groupedRows.length; i++) {
    const item = groupedRows[i];
    const itemHeight = item.type === 'title' ? sectionTitleHeight : rowHeight;
    
    if (currentHeight + itemHeight > availableHeight - spaceBuffer && currentPage.length > 0) {
      pages.push([...currentPage]);
      currentPage = [];
      currentHeight = 0;
    }
    
    currentPage.push(item);
    currentHeight += itemHeight;
    
    if (currentPage.length >= maxItemsPerPage) {
      pages.push([...currentPage]);
      currentPage = [];
      currentHeight = 0;
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  // Force multiple pages if we have enough content
  if (pages.length === 1 && groupedRows.length > 10) {
    const itemsPerPage = Math.max(8, Math.floor(groupedRows.length / 2));
    pages.length = 0;
    for (let i = 0; i < groupedRows.length; i += itemsPerPage) {
      pages.push(groupedRows.slice(i, i + itemsPerPage));
    }
  }
  
  const totalPages = pages.length || 1;
  
  return { pages, totalPages };
};

