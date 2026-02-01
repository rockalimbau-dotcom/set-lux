import { readPdfText } from './readPdfText';
import { parsePlanText } from './parsePlanText';
import { ImportResult } from '../types';

export async function parsePlanPdf(file: File): Promise<ImportResult> {
  const text = await readPdfText(file);
  if (!text.trim()) {
    return { weeks: [], warnings: ['no-text'] };
  }
  return parsePlanText(text);
}
