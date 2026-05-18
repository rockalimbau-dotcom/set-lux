/** Altura fija del lienzo PDF (A4 apaisado @ 1123×794 px). */
export const PDF_PAGE_HEIGHT_PX = 794;

/** Margen de seguridad para no rozar el borde al rasterizar. */
export const PDF_PAGE_FIT_MARGIN_PX = 20;

/**
 * Mide la altura real del contenido de una página de reporte.
 * Desactiva temporalmente el alto fijo de .container-pdf (794px) para que
 * scrollHeight refleje el contenido completo y no un recorte con overflow:hidden.
 */
export async function measureReportPageHeight(html: string): Promise<number> {
  if (typeof document === 'undefined') return 0;

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '297mm';
  tempContainer.style.height = 'auto';
  tempContainer.style.maxHeight = 'none';
  tempContainer.style.overflow = 'visible';
  tempContainer.style.backgroundColor = 'white';

  document.body.appendChild(tempContainer);

  const root = tempContainer.querySelector('.container-pdf') as HTMLElement | null;
  const content = tempContainer.querySelector('.content') as HTMLElement | null;
  const tableContainer = tempContainer.querySelector('.table-container') as HTMLElement | null;

  if (root) {
    root.style.height = 'auto';
    root.style.minHeight = '0';
    root.style.overflow = 'visible';
  }
  if (content) {
    content.style.flex = 'none';
    content.style.overflow = 'visible';
  }
  if (tableContainer) {
    tableContainer.style.overflow = 'visible';
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const height = root?.scrollHeight ?? tempContainer.scrollHeight;

  document.body.removeChild(tempContainer);
  return height;
}

export function reportPageFits(
  contentHeight: number,
  maxPageHeight: number = PDF_PAGE_HEIGHT_PX
): boolean {
  return contentHeight <= maxPageHeight - PDF_PAGE_FIT_MARGIN_PX;
}

/**
 * Comprueba si el último bloque de trabajador queda recortado con el layout fijo del PDF
 * (mismas restricciones que html2canvas: 794px + overflow hidden).
 */
export async function doesReportPageClip(html: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '297mm';
  tempContainer.style.height = '210mm';
  tempContainer.style.overflow = 'hidden';
  tempContainer.style.backgroundColor = 'white';

  document.body.appendChild(tempContainer);

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const root = tempContainer.querySelector('.container-pdf') as HTMLElement | null;
  const footer = tempContainer.querySelector('.footer') as HTMLElement | null;
  const lastBlock = tempContainer.querySelector(
    'tbody.person-block:last-of-type'
  ) as HTMLElement | null;

  let clips = false;
  if (root && lastBlock) {
    const footerTop = footer?.getBoundingClientRect().top ?? root.getBoundingClientRect().bottom;
    const blockBottom = lastBlock.getBoundingClientRect().bottom;
    clips = blockBottom > footerTop - 4;
  }

  document.body.removeChild(tempContainer);
  return clips;
}

export async function reportPageLayoutOk(html: string): Promise<boolean> {
  const height = await measureReportPageHeight(html);
  if (!reportPageFits(height)) return false;
  return !(await doesReportPageClip(html));
}
