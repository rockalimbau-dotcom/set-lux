import html2canvas from 'html2canvas';
import type { jsPDF } from 'jspdf';

import {
  PDF_IMAGE_COMPRESSION,
  PDF_IMAGE_FORMAT,
  PDF_RENDER_SCALE,
  canvasToPdfImage,
} from './raster';

/** A4 landscape at 96 DPI */
export const PDF_LANDSCAPE_WIDTH_PX = 1123;
export const PDF_LANDSCAPE_HEIGHT_PX = 794;
export const PDF_LANDSCAPE_WIDTH_MM = 297;
export const PDF_LANDSCAPE_HEIGHT_MM = 210;

/** Escala uniforme para que el contenido quepa a ancho completo sin deformar el texto. */
export function computeUniformLayoutScale(naturalHeightPx: number): number {
  if (naturalHeightPx <= 0) return 1;
  return Math.min(1, PDF_LANDSCAPE_HEIGHT_PX / naturalHeightPx);
}

export function fitRectInLandscapePage(
  contentWidth: number,
  contentHeight: number
): { x: number; y: number; width: number; height: number } {
  const pageW = PDF_LANDSCAPE_WIDTH_MM;
  const pageH = PDF_LANDSCAPE_HEIGHT_MM;

  if (contentWidth <= 0 || contentHeight <= 0) {
    return { x: 0, y: 0, width: pageW, height: pageH };
  }

  const ratio = contentWidth / contentHeight;
  let width = pageW;
  let height = pageW / ratio;

  if (height > pageH) {
    height = pageH;
    width = pageH * ratio;
  }

  return {
    x: (pageW - width) / 2,
    y: (pageH - height) / 2,
    width,
    height,
  };
}

function applyLayoutScale(container: HTMLElement, layoutScale: number): void {
  const unscaledWidth = PDF_LANDSCAPE_WIDTH_PX / layoutScale;
  const unscaledHeight = PDF_LANDSCAPE_HEIGHT_PX / layoutScale;

  container.style.overflow = 'visible';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.width = `${unscaledWidth}px`;
  container.style.maxWidth = `${unscaledWidth}px`;
  container.style.height = `${unscaledHeight}px`;
  container.style.minHeight = `${unscaledHeight}px`;

  if (layoutScale < 1) {
    container.style.transform = `scale(${layoutScale})`;
    container.style.transformOrigin = 'top left';
  } else {
    container.style.transform = '';
  }
}

function applyFillPageFlexLayout(container: HTMLElement): void {
  const content = container.querySelector('.content') as HTMLElement | null;
  if (content) {
    content.style.flex = '1 1 auto';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.minHeight = '0';
  }

  const tableContainer = container.querySelector('.table-container') as HTMLElement | null;
  if (tableContainer) {
    tableContainer.style.flex = '1 1 auto';
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.minHeight = '0';
  }

  const table = container.querySelector('table') as HTMLElement | null;
  if (table) {
    table.style.flex = '1 1 auto';
    table.style.height = '100%';
    table.style.minHeight = '0';
  }

  const tbody = container.querySelector('tbody') as HTMLElement | null;
  if (tbody) {
    tbody.style.height = '100%';
  }

  const fillRow = container.querySelector('tr.pdf-table-fill') as HTMLElement | null;
  if (fillRow) {
    fillRow.style.height = '99%';
  }

  const footer = container.querySelector('.footer') as HTMLElement | null;
  if (footer) {
    footer.style.flexShrink = '0';
    footer.style.marginTop = 'auto';
    footer.style.marginBottom = '0';
  }
}

function prepareClonedLandscapeDocument(
  clonedDoc: Document,
  layoutScale: number
): void {
  const container = clonedDoc.querySelector('.container-pdf') as HTMLElement | null;
  if (container) {
    applyLayoutScale(container, layoutScale);
    applyFillPageFlexLayout(container);
  }

  clonedDoc.querySelectorAll('table').forEach(table => {
    const el = table as HTMLElement;
    el.style.tableLayout = 'fixed';
    el.style.width = '100%';
  });

  clonedDoc.querySelectorAll('td:not(:first-child), th:not(:first-child)').forEach(cell => {
    const el = cell as HTMLElement;
    el.style.maxWidth = '0';
    el.style.overflowWrap = 'anywhere';
    el.style.wordBreak = 'break-word';
    el.style.verticalAlign = 'top';
  });

  clonedDoc.querySelectorAll('.td-label').forEach(label => {
    const el = label as HTMLElement;
    el.style.minHeight = '0';
    el.style.height = 'auto';
  });

  const footer = clonedDoc.querySelector('.footer') as HTMLElement | null;
  if (footer) {
    footer.style.position = 'relative';
    footer.style.display = 'flex';
    footer.style.visibility = 'visible';
    footer.style.opacity = '1';
  }
}

function waitForLayout(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Renders HTML off-screen and captures it at page aspect ratio without stretching text.
 */
export async function captureLandscapeHtml(html: string): Promise<HTMLCanvasElement> {
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = `${PDF_LANDSCAPE_WIDTH_PX}px`;
  tempContainer.style.height = 'auto';
  tempContainer.style.overflow = 'visible';
  tempContainer.style.background = '#ffffff';

  document.body.appendChild(tempContainer);

  const inner = tempContainer.querySelector('.container-pdf') as HTMLElement | null;
  if (inner) {
    inner.style.height = 'auto';
    inner.style.minHeight = '0';
  }

  await waitForLayout();

  const naturalHeight = Math.max(inner?.scrollHeight ?? tempContainer.scrollHeight, 1);
  const layoutScale = computeUniformLayoutScale(naturalHeight);

  if (inner) {
    applyLayoutScale(inner, layoutScale);
    applyFillPageFlexLayout(inner);
  }

  tempContainer.style.height = `${PDF_LANDSCAPE_HEIGHT_PX}px`;
  tempContainer.style.overflow = 'hidden';

  await waitForLayout();

  const width = PDF_LANDSCAPE_WIDTH_PX;
  const height = PDF_LANDSCAPE_HEIGHT_PX;

  try {
    return await html2canvas(tempContainer, {
      scale: PDF_RENDER_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      onclone: doc => prepareClonedLandscapeDocument(doc, layoutScale),
    });
  } finally {
    document.body.removeChild(tempContainer);
  }
}

/** Adds a captured canvas filling the full A4 landscape page (canvas is already page-sized). */
export function addLandscapeCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement): void {
  const imgData = canvasToPdfImage(canvas);
  pdf.addImage(
    imgData,
    PDF_IMAGE_FORMAT,
    0,
    0,
    PDF_LANDSCAPE_WIDTH_MM,
    PDF_LANDSCAPE_HEIGHT_MM,
    undefined,
    PDF_IMAGE_COMPRESSION
  );
}
