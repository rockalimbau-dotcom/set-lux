import { BuildNominaMonthHTMLParams } from './types';
import { buildNominaMonthHTML } from './buildNominaMonthHTML';

/**
 * Open a print window with HTML content
 */
export function openPrintWindow(html: string) {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

/**
 * Open PDF window (fallback to HTML print window for now)
 */
function openPDFWindow({
  project,
  monthKey,
  enrichedRows,
  monthLabelEs,
}: BuildNominaMonthHTMLParams) {
  // For now, fallback to HTML print window
  // In the future, we could implement a PDF preview
  const html = buildNominaMonthHTML({ project, monthKey, enrichedRows, monthLabelEs });
  openPrintWindow(html);
}

