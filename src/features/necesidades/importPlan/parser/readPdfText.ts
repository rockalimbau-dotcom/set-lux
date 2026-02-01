import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const lineJoin = (items: { x: number; str: string }[]) =>
  items
    .sort((a, b) => a.x - b.x)
    .map(item => item.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function readPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; str: string }[]>();

    (content.items as TextItem[]).forEach(item => {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const row = rows.get(y) || [];
      row.push({ x, str: item.str });
      rows.set(y, row);
    });

    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
    sortedYs.forEach(y => {
      const rowText = lineJoin(rows.get(y) || []);
      if (rowText) lines.push(rowText);
    });
  }

  return lines.join('\n');
}
