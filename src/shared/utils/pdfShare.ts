import jsPDF from 'jspdf';

type ShareableNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

export async function shareOrSavePDF(
  pdf: jsPDF,
  filename: string,
  title?: string
): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined') {
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      const nav = navigator as ShareableNavigator;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: title || filename });
        return true;
      }
    }
  } catch (error) {
    console.warn('PDF share failed, falling back to download.', error);
  }

  pdf.save(filename);
  return false;
}
