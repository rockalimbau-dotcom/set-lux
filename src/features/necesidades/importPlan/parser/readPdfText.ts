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

const extractDateTokens = (text: string) => Array.from(text.matchAll(/\b(\d{1,2}\/\d{1,2})\b/g)).map(m => m[1]);

const extractTimeRangeText = (text: string) => {
  const match = text.match(/\b\d{1,2}(?:[.:]\d{2})?H?\s*[-–]\s*\d{1,2}(?:[.:]\d{2})?H?\b/i);
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
};

const clusterPositions = (positions: number[], tolerance = 18) => {
  const sorted = [...positions].sort((a, b) => a - b);
  const clusters: number[] = [];
  sorted.forEach(pos => {
    const last = clusters[clusters.length - 1];
    if (last === undefined || Math.abs(pos - last) > tolerance) {
      clusters.push(pos);
    } else {
      clusters[clusters.length - 1] = Math.round((last + pos) / 2);
    }
  });
  return clusters;
};

export async function readPdfCalendarText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const derivedLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items as TextItem[];

    const datePositions: number[] = [];
    const rows = new Map<number, { x: number; str: string }[]>();

    items.forEach(item => {
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const row = rows.get(y) || [];
      row.push({ x, str: item.str });
      rows.set(y, row);
      if (/\b\d{1,2}\/\d{1,2}\b/.test(item.str)) {
        datePositions.push(x);
      }
    });

    const columnCenters = clusterPositions(datePositions);
    if (columnCenters.length === 0) continue;

    const sortedYs = Array.from(rows.keys()).sort((a, b) => b - a);
    const currentDateByColumn = new Map<number, string>();

    sortedYs.forEach(y => {
      const rowItems = rows.get(y) || [];
      const columns: { x: number; str: string }[][] = columnCenters.map(() => []);

      rowItems.forEach(item => {
        let bestIndex = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        columnCenters.forEach((center, idx) => {
          const distance = Math.abs(item.x - center);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = idx;
          }
        });
        if (bestIndex >= 0 && bestDistance <= 60) {
          columns[bestIndex].push(item);
        }
      });

      columns.forEach((colItems, idx) => {
        if (colItems.length === 0) return;
        const rowText = lineJoin(colItems);
        const dates = extractDateTokens(rowText);
        if (dates.length > 0) {
          currentDateByColumn.set(idx, dates[dates.length - 1]);
        }
        const timeText = extractTimeRangeText(rowText);
        if (timeText) {
          const dateToken = currentDateByColumn.get(idx);
          if (dateToken) {
            derivedLines.push(`${dateToken} ${timeText} [COL:${idx}]`);
          }
        }
      });
    });
  }

  return derivedLines.join('\n');
}

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
