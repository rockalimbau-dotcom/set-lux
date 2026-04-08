import jsPDF from 'jspdf';

export async function shareOrSavePDF(
  pdf: jsPDF,
  filename: string,
  title?: string
): Promise<boolean> {
  pdf.save(filename);

  void title;
  return false;
}
