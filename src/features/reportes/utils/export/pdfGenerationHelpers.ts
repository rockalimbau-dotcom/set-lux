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
  // IMPORTANTE: Permitir que el contenedor se expanda para capturar todo el contenido
  tempContainer.style.minHeight = '210mm';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.overflow = 'visible'; // Cambiar a 'visible' para capturar todo el contenido

  document.body.appendChild(tempContainer);
  await new Promise(resolve => setTimeout(resolve, 200));

  const canvas = await html2canvas(tempContainer, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 1123,
    // No limitar height, dejar que html2canvas calcule la altura real del contenido
    scrollX: 0,
    scrollY: 0,
    windowWidth: 1123,
    // No limitar windowHeight, dejar que se calcule automáticamente
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
  
  // Retornar la altura real (sin limitar) para que el código de paginación maneje la división
  return { imgData, imgHeight: imgHeightMM };
}

