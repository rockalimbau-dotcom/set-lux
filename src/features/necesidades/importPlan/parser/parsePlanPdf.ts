import { readPdfCalendarText, readPdfText } from './readPdfText';
import { parsePlanText } from './parsePlanText';
import { ImportResult } from '../types';

export async function parsePlanPdf(file: File): Promise<ImportResult> {
  const text = await readPdfText(file);
  if (!text.trim()) {
    return { weeks: [], warnings: ['no-text'] };
  }
  const isCalendarSchedule =
    /CALENDAR\s+PREP\s*&\s*SHOOTING\s+SCHEDULE/i.test(text) || /CALENDAR\s+SCHEDULE/i.test(text);
  if (isCalendarSchedule) {
    const calendarText = await readPdfCalendarText(file);
    const merged = calendarText ? `${calendarText}\n${text}` : text;
    return parsePlanText(merged);
  }
  return parsePlanText(text);
}
