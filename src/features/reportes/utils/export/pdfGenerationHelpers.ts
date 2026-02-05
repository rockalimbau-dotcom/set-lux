import html2canvas from 'html2canvas';

interface GeneratePDFPageParams {
  html: string;
  weekIndex: number;
  pageIndex: number;
}

/**
 * Generate a PDF page from HTML
 */
export async function generatePDFPageFromHTML({
  html,
  weekIndex,
  pageIndex,
}: GeneratePDFPageParams): Promise<{ imgData: string; imgHeight: number }> {
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '297mm';
  tempContainer.style.height = '210mm';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.overflow = 'hidden';

  document.body.appendChild(tempContainer);
  await new Promise(resolve => setTimeout(resolve, 200));

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

  document.body.removeChild(tempContainer);

  const imgData = canvas.toDataURL('image/png');
  // Convertir altura de píxeles a mm (297mm es el ancho de A4 landscape)
  // canvas.width = 1123px (297mm), canvas.height en píxeles
  const imgHeightMM = (canvas.height / canvas.width) * 297;
  
  // Limitar la altura máxima a 210mm (altura de A4 landscape)
  const maxPageHeightMM = 210;
  const imgHeight = Math.min(imgHeightMM, maxPageHeightMM);
  
  return { imgData, imgHeight };
}

