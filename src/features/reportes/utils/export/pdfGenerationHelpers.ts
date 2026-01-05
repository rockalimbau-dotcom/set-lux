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
  tempContainer.style.width = '1123px';
  tempContainer.style.height = 'auto';
  tempContainer.style.minHeight = '794px';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.overflow = 'visible';

  document.body.appendChild(tempContainer);
  await new Promise(resolve => setTimeout(resolve, 200));

  const footer = tempContainer.querySelector('.footer') as HTMLElement;
  if (footer) {
  } else {
  }

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

  document.body.removeChild(tempContainer);

  const imgData = canvas.toDataURL('image/png');
  const imgHeight = (canvas.height / canvas.width) * 297;
  
  return { imgData, imgHeight };
}

