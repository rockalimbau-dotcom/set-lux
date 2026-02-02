import { toYYYYMMDD } from '@shared/utils/date';
import { normalize } from './text';
import { extractHorario } from './schedule';

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
  gener: 0,
  febrer: 1,
  març: 2,
  abril_: 3,
  maig: 4,
  juny: 5,
  juliol: 6,
  agost: 7,
  setembre: 8,
  octubre_: 9,
  novembre: 10,
  desembre: 11,
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const normalizeMonthKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('abril', 'abril_')
    .replace('octubre', 'octubre_');

export const extractYear = (lines: string[]) => {
  const joined = lines.join(' ');
  const yearMatch = joined.match(/\b(20\d{2})\b/);
  if (yearMatch) return Number(yearMatch[1]);
  const shortYearMatch = joined.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-](\d{2})\b/);
  if (shortYearMatch) return 2000 + Number(shortYearMatch[1]);
  return new Date().getFullYear();
};

export const extractWeekLabel = (line: string) => {
  const match = line.match(/\b(SEMANA|WEEK)\s+(-?\d+)(?:\s*-\s*(.+))?/i);
  if (!match) return null;
  const suffix = match[3]?.trim();
  return suffix ? `Semana ${match[2]} - ${suffix}` : `Semana ${match[2]}`;
};

const parseDateFromParts = (dayRaw: string, monthRaw: string, year: number) => {
  const dayNumber = Number(dayRaw);
  let month: number | undefined;
  if (/^\d{1,2}$/.test(monthRaw)) {
    const numericMonth = Number(monthRaw) - 1;
    month = Number.isNaN(numericMonth) ? undefined : numericMonth;
  } else {
    const monthKey = normalizeMonthKey(monthRaw);
    month = MONTHS[monthKey];
  }
  if (Number.isNaN(dayNumber) || month === undefined) return null;
  return new Date(year, month, dayNumber);
};

export const extractDayStart = (line: string, year: number) => {
  const dayMatch = line.match(
    /D[IÍ]A\s+\d+\s*[-–]\s*[^0-9]*?(\d{1,2})\s+(?:DE\s+)?([A-ZÁÉÍÓÚÜÑa-záéíóúüñ]{3,})(?:\s+(20\d{2}))?/i
  );
  const dotMatch = line.match(
    /D[IÍ]A\s+\d+\.\s*[A-ZÁÉÍÓÚÜÑa-záéíóúüñ]{3,}\s+(\d{1,2})\s+(?:DE\s+)?([A-ZÁÉÍÓÚÜÑa-záéíóúüñ]{3,})(?:\s+(20\d{2}))?/i
  );
  const altMatch = line.match(
    /\b(LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO|DOMINGO)\s*,?\s+(\d{1,2})\s+(?:DE\s+)?([A-ZÁÉÍÓÚÜÑa-záéíóúüñ]{3,})(?:\s+(20\d{2}))?/i
  );
  const englishMatch = line.match(
    /\b(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s*,?\s+([A-Z]+)\s+(\d{1,2})(?:ST|ND|RD|TH)?(?:,?\s*(\d{4}))?/i
  );
  const englishDayMatch = line.match(
    /DAY\s+\d+\s*[-–]\s*(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s+([A-Z]+)\s+(\d{1,2})(?:ST|ND|RD|TH)?(?:,?\s*(\d{4}))?/i
  );
  const diaNumericMatch = line.match(
    /DIA\s+\d+\s*[-–]\s*[A-ZÁÉÍÓÚÜÑa-záéíóúüñ.]+\s+(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/i
  );
  const numericMatch = line.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  const match = dayMatch || dotMatch || altMatch || englishMatch || englishDayMatch;
  if (!match && !diaNumericMatch && !numericMatch) return null;

  let date: Date | null = null;
  if ((englishMatch && match === englishMatch) || (englishDayMatch && match === englishDayMatch)) {
    const monthRaw = match[2];
    const dayNumber = match[3];
    const yearOverride = match[4] ? Number(match[4]) : undefined;
    date = parseDateFromParts(dayNumber, monthRaw, yearOverride || year);
  } else if (dayMatch || dotMatch) {
    const dayNumber = match![1];
    const monthRaw = match![2];
    const yearOverride = match![3] ? Number(match![3]) : undefined;
    date = parseDateFromParts(dayNumber, monthRaw, yearOverride || year);
  } else if (altMatch) {
    const dayNumber = match![2];
    const monthRaw = match![3];
    const yearOverride = match![4] ? Number(match![4]) : undefined;
    date = parseDateFromParts(dayNumber, monthRaw, yearOverride || year);
  }
  if (!date && diaNumericMatch) {
    const yearRaw = diaNumericMatch[3];
    const numericYear = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
    date = parseDateFromParts(diaNumericMatch[1], diaNumericMatch[2], numericYear);
  }
  if (
    !date &&
    numericMatch &&
    /\b(DIA|DÍA|LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO|DOMINGO)\b/i.test(
      line
    )
  ) {
    const yearRaw = numericMatch[3];
    const numericYear = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
    date = parseDateFromParts(numericMatch[1], numericMatch[2], numericYear);
  }
  if (!date) return null;

  const { start, end } = extractHorario(line);
  return {
    dateISO: toYYYYMMDD(date),
    start,
    end,
  };
};

export const normalizeDayLine = (line: string) => normalize(line);

export const extractCalendarDates = (line: string, year: number) => {
  if (/\b\d+\s*\/\s*\d+\b/.test(line) && /\b(pg|pgs|pags|pag)\b/i.test(line)) {
    return [];
  }
  const matches = Array.from(line.matchAll(/\b(\d{1,2})[\/-](\d{1,2})\b/g));
  if (matches.length === 0) return [];
  return matches
    .map(match => {
      const date = parseDateFromParts(match[1], match[2], year);
      return date ? toYYYYMMDD(date) : null;
    })
    .filter((value): value is string => Boolean(value));
};
