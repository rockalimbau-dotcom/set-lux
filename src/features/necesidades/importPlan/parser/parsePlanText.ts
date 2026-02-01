import { mondayOf, parseYYYYMMDD, toYYYYMMDD } from '@shared/utils/date';
import { ImportDay, ImportResult, ImportScope, ImportSequence, ImportWeek } from '../types';

const OBSERVATION_TAGS = [
  'equipo reducido',
  'vuelta a barcelona',
  'viaje a madrid',
];

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
};

const normalize = (line: string) => line.replace(/\s+/g, ' ').trim();

const normalizeMonthKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('abril', 'abril_')
    .replace('octubre', 'octubre_');

const normalizeTime = (raw?: string) => {
  if (!raw) return '';
  const cleaned = raw.replace(/[hH]/g, '').trim().replace('.', ':');
  const [hh, mm] = cleaned.split(':');
  if (!hh) return '';
  return `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}`;
};

const extractYear = (lines: string[]) => {
  const yearMatch = lines.join(' ').match(/\b(20\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
};

const extractWeekLabel = (line: string) => {
  const match = line.match(/SEMANA\s+(-?\d+)/i);
  if (!match) return null;
  return `Semana ${match[1]}`;
};

const extractHorario = (line: string) => {
  const match = line.match(/(?:HORARIO|H)\s*(?:APROX\.)?[^0-9]*([0-9:.]+)\s*(?:h)?\s*[-–a]\s*([0-9:.]+)/i);
  if (!match) return {};
  return {
    start: normalizeTime(match[1]),
    end: normalizeTime(match[2]),
  };
};

const extractDayStart = (line: string, year: number) => {
  const dayMatch = line.match(
    /DÍA\s+\d+\s*-\s*[^0-9]*?(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÜÑ]+)/i
  );
  const dotMatch = line.match(
    /DÍA\s+\d+\.\s*[A-ZÁÉÍÓÚÜÑ]+\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÜÑ]+)/i
  );
  const altMatch = line.match(
    /^(LUNES|MARTES|MIÉRCOLES|MIERCOLES|JUEVES|VIERNES|SÁBADO|SABADO|DOMINGO)\s+(\d{1,2})\s+([A-ZÁÉÍÓÚÜÑ]+)/i
  );
  const match = dayMatch || dotMatch || altMatch;
  if (!match) return null;

  const dayNumber = Number(match[1] || match[2]);
  const monthRaw = match[2] || match[3];
  const monthKey = normalizeMonthKey(monthRaw);
  const month = MONTHS[monthKey];
  if (Number.isNaN(dayNumber) || month === undefined) return null;

  const { start, end } = extractHorario(line);
  const date = new Date(year, month, dayNumber);
  return {
    dateISO: toYYYYMMDD(date),
    start,
    end,
  };
};

const isObservationLine = (line: string) => {
  const lower = line.toLowerCase();
  return OBSERVATION_TAGS.some(tag => lower.includes(tag));
};

const isTrasladoLine = (line: string) => /traslado|trasllat/i.test(line);

const isPrelightLine = (line: string) => /prelight\s+\d+/i.test(line);

const parsePrelightTime = (line: string) => {
  const minMatch = line.match(/prelight\s+(\d+)\s*min/i);
  if (minMatch) {
    const mins = Number(minMatch[1]);
    return `00:${String(mins).padStart(2, '0')}`;
  }
  const hourMatch = line.match(/prelight\s+(\d+)\s*h(?:ora)?/i);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return `${String(hours).padStart(2, '0')}:00`;
  }
  return '';
};

const isSequenceLine = (line: string) => {
  if (/^DÍA\s+/i.test(line)) return false;
  if (/\bDay\b/i.test(line)) return false;
  if (/^\s*\d{1,2}[:.]\d{2}\b/.test(line)) return false;
  if (/pgs/i.test(line)) return false;
  return /^\s*\d{1,3}(?:\.\d{1,2}[A-Z]?)?(?:\s+|:)\s*.+/.test(line);
};

const isNoiseLine = (line: string) => {
  const lower = line.toLowerCase();
  return (
    /^\s*\d+\s*\/\s*\d+/.test(line) ||
    /\b\d+\s*\/\s*\d+\b/.test(line) ||
    /^\s*-\s*\d+\s*\/\s*\d+/.test(line) ||
    /^\s*\d{4}\s*$/.test(line) ||
    /^\s*\d+(,\s*\d+)+\s*$/.test(line) ||
    /\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/.test(line) ||
    /^(dia|día|noc|noche|tarde|amanecer|mañana|manana)$/i.test(line.trim()) ||
    lower.startsWith('pags') ||
    lower.startsWith('guion') ||
    lower.startsWith('df') ||
    lower.startsWith('personajes') ||
    lower.startsWith('figuracion') ||
    lower.startsWith('figuración') ||
    lower.startsWith('horario') ||
    lower.startsWith('making') ||
    lower.startsWith('foto') ||
    lower.startsWith('prev') ||
    lower.startsWith('pru') ||
    lower.startsWith('off') ||
    lower.startsWith('procesos') ||
    lower.startsWith('entrevistas') ||
    lower.startsWith('asistencia') ||
    lower.includes('pags') ||
    lower.includes('guion') ||
    lower.includes('personajes') ||
    lower.includes('figuracion') ||
    lower.includes('figuración')
  );
};

const CAPS_IGNORE = new Set([
  'LUZ',
  'VEH',
  'PREV',
  'MUS',
  'PRU',
  'OFF',
  'FOTO',
  'MAKING',
  'PROCESOS',
  'ENTREVISTAS',
  'ASISTENCIA',
]);
const SHORT_LOC_TOKENS = new Set([
  'INT',
  'EXT',
  'I/E',
  'DIA',
  'DÍA',
  'NOCHE',
  'TARDE',
  'AMANECER',
  'MANANA',
  'MAÑANA',
]);

const isCityOverrideLine = (line: string) => {
  const clean = line.replace(/[0-9]/g, '').trim();
  if (!clean) return false;
  if (CAPS_IGNORE.has(clean)) return false;
  const isUpper = clean === clean.toUpperCase();
  const wordCount = clean.split(/\s+/).length;
  return isUpper && wordCount <= 3;
};

const extractCityOverride = (line: string) =>
  normalize(line.split(',')[0]).replace(/[0-9]/g, '').trim();

const combineLocationWithCity = (location: string, city: string) => {
  const locClean = normalize(location);
  const cityClean = normalize(city);
  if (!locClean || !cityClean) return location;
  const locUpper = locClean.toUpperCase();
  const cityUpper = cityClean.toUpperCase();
  const locToken = locUpper.replace(/[()]/g, '').trim();
  if (SHORT_LOC_TOKENS.has(locToken)) return cityClean;
  if (locUpper.includes(cityUpper)) return locClean;
  return `${locClean} - ${cityClean}`;
};

const LOCATION_IGNORE = new Set([
  'MAKING',
  'PROMO',
  'CARTEL',
  'FOTO FIJA',
  'VISITA',
  'UNIDAD',
  'COVER',
  'PENDIENTE',
  'RESTO',
  'CAMARA',
  'CÁMARA',
  'PREVENIDA',
  'TBC',
]);

const isLocationIgnoreLine = (line: string) => {
  const clean = normalize(line).replace(/[0-9]/g, '').trim();
  if (!clean) return false;
  const upper = clean.toUpperCase();
  return Array.from(LOCATION_IGNORE).some(token => upper.startsWith(token));
};

const isLocationCandidate = (line: string) => {
  if (isLocationIgnoreLine(line)) return false;
  const clean = normalize(line);
  if (!clean) return false;
  if (/^\d{1,4}$/.test(clean)) return false;
  if (/^\d+(,\s*\d+)+$/.test(clean)) return false;
  if (/\b\d+\s*\/\s*\d+\b/.test(clean)) return false;
  if (/\d{1,2}[:.]\d{2}\s*[-–]/.test(clean)) return false;
  if (/\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}/.test(clean)) return false;
  if (/\bTBC\b/i.test(clean)) return false;
  if (/^(DIA|DÍA|NOC|NOCHE|TARDE|AMANECER|MAÑANA|MANANA)$/i.test(clean)) return false;
  const hasLower = /[a-záéíóúüñ]/.test(clean);
  const hasUpper = /[A-ZÁÉÍÓÚÜÑ]/.test(clean);
  const hasSeparators = /[()/]|\/|\.|,/.test(clean);
  const wordCount = clean.split(' ').length;
  if (hasLower && !hasSeparators && wordCount >= 3) return false;
  if (wordCount > 6 && !hasSeparators && !(hasUpper && !hasLower)) return false;
  return true;
};

const extractLocationFromTitle = (title: string) => {
  const match = title.match(/\b(INT|EXT|I\/E)\b\s*(.+)$/i);
  if (!match) return null;
  const candidate = normalize(match[2]);
  if (!candidate) return null;
  if (SHORT_LOC_TOKENS.has(candidate.toUpperCase())) return null;
  if (!isLocationCandidate(candidate)) return null;
  return candidate;
};

const extractSequenceLocationLine = (line: string) => {
  const clean = normalize(line).replace(/^-+/, '').trim();
  if (!clean) return null;
  if (isLocationIgnoreLine(clean)) return null;
  if (SHORT_LOC_TOKENS.has(clean.toUpperCase())) return null;
  if (/\bTBC\b/i.test(clean)) return null;
  if (/\d{1,2}[:.]\d{2}\s*[-–]/.test(clean)) return null;
  const hasLocToken = /\b(INT|EXT|I\/E)\b/i.test(clean);
  if (!hasLocToken && !isLocationCandidate(clean)) return null;
  return clean;
};

const sanitizeSequenceTitle = (title: string) => {
  let clean = title;
  clean = clean.split(/Guion|Pags|DF|Personajes|Figuraci[oó]n|Figuracion|Veh|Luz|Hora Azul|MAKING|FOTO|PREV|PRU|OFF/i)[0] || '';
  clean = clean.replace(/\b\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}\b/g, '');
  clean = clean.replace(/\b\d+\s*\/\s*\d+\b/g, '');
  clean = clean.replace(/-{2,}/g, ' ');
  clean = clean.replace(/\s{2,}/g, ' ').trim();
  return clean;
};

const extractLocation = (line: string) => {
  if (!isLocationCandidate(line)) return null;
  if (/\d+\s*\/\s*\d+/.test(line)) return null;
  if (/\d{1,2}[:.]\d{2}\s*[-–]/.test(line)) return null;
  const split = line.split(/Guion|DF|Personajes|Figuraci[oó]n|Pags|Pag/)[0] || '';
  const clean = normalize(split).replace(/[-–]+$/, '').trim();
  if (!clean) return null;
  const wordCount = clean.split(' ').length;
  if (wordCount > 4 && clean.endsWith('.')) return null;
  return clean;
};

const buildLocationSequencesText = (sequences: ImportSequence[], defaultLocation?: string) => {
  if (sequences.length === 0) return defaultLocation || '';
  const allNoLoc = sequences.every(seq => !seq.location);
  if (allNoLoc) {
    const list = sequences.map(seq => `- ${seq.label}`).join('\n');
    return defaultLocation ? `${defaultLocation}\n\n${list}` : list;
  }

  const lines: string[] = [];
  let lastLoc = '';
  sequences.forEach(seq => {
    const loc = seq.location || 'Sin localización';
    if (loc !== lastLoc) {
      if (lines.length > 0) lines.push('');
      lines.push(loc);
      lastLoc = loc;
    }
    lines.push(`- ${seq.label}`);
  });
  if (!defaultLocation) return lines.join('\n');
  const firstLoc = lines[0] || '';
  if (firstLoc && defaultLocation.trim().toUpperCase() === firstLoc.trim().toUpperCase()) {
    return lines.join('\n');
  }
  return `${defaultLocation}\n\n${lines.join('\n')}`;
};

type PlanProfile = 'calendar' | 'plan' | 'generic';

const detectProfile = (lines: string[]): PlanProfile => {
  const joined = lines.join(' ').toUpperCase();
  if (joined.includes('CALENDAR') || joined.includes('CALENDARIO')) return 'calendar';
  if (joined.includes('PLAN RODAJE') || joined.includes('PLAN DE RODAJE')) return 'plan';
  return 'generic';
};

const shouldAcceptLocationText = (text: string, minWords: number) => {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < minWords) return false;
  if (wordCount > 8 && !/[()/]/.test(text)) return false;
  return true;
};

const extractLocationContext = (line: string, profile: PlanProfile) => {
  if (isCityOverrideLine(line)) return null;
  if (isLocationIgnoreLine(line)) return null;
  const minWords = profile === 'calendar' ? 2 : 1;
  const seqLoc = extractSequenceLocationLine(line);
  if (seqLoc && shouldAcceptLocationText(seqLoc, minWords)) return seqLoc;
  const loc = extractLocation(line);
  if (loc && shouldAcceptLocationText(loc, minWords)) return loc;
  return null;
};

export function parsePlanText(text: string): ImportResult {
  const rawLines = text.split('\n').map(normalize).filter(Boolean);
  const profile = detectProfile(rawLines);
  const year = extractYear(rawLines);
  const warnings: string[] = [];
  let currentWeekLabel: string | null = null;
  let currentDay: {
    dateISO: string;
    start?: string;
    end?: string;
    weekLabel?: string;
    precall?: string;
    defaultLocation?: string;
    locationContext?: string;
    sequences: ImportSequence[];
    observations: Set<string>;
    transport: string[];
  } | null = null;
  let lastSeqId = '';

  const parsedDays: ImportDay[] = [];

  const finalizeDay = () => {
    if (!currentDay) return;
    const sequences = currentDay.defaultLocation
      ? currentDay.sequences.map(seq => ({
          ...seq,
          location: seq.location || currentDay.defaultLocation,
        }))
      : currentDay.sequences;
    const locationSequencesText = buildLocationSequencesText(sequences, currentDay.defaultLocation);
    const weekStart = toYYYYMMDD(mondayOf(parseYYYYMMDD(currentDay.dateISO)));
    const dayIndex = Math.floor(
      (parseYYYYMMDD(currentDay.dateISO).getTime() - parseYYYYMMDD(weekStart).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    parsedDays.push({
      dateISO: currentDay.dateISO,
      weekStart,
      dayIndex,
      weekLabel: currentDay.weekLabel,
      sequences,
      locationSequencesText,
      transportText: currentDay.transport.join('\n'),
      observationsText: Array.from(currentDay.observations).join('\n'),
      precall: currentDay.precall,
      crewStart: currentDay.start,
      crewEnd: currentDay.end,
      crewTipo: 'Rodaje',
    });
  };

  rawLines.forEach(line => {
    const weekLabel = extractWeekLabel(line);
    if (weekLabel) {
      currentWeekLabel = weekLabel;
      return;
    }

    const dayStart = extractDayStart(line, year);
    if (dayStart) {
      finalizeDay();
      currentDay = {
        dateISO: dayStart.dateISO,
        start: dayStart.start,
        end: dayStart.end,
        weekLabel: currentWeekLabel || undefined,
        precall: undefined,
        defaultLocation: undefined,
        locationContext: undefined,
        sequences: [],
        observations: new Set(),
        transport: [],
      };
      lastSeqId = '';
      return;
    }

    if (!currentDay) return;

    const horarioInline = extractHorario(line);
    if (horarioInline.start || horarioInline.end) {
      currentDay.start = horarioInline.start || currentDay.start;
      currentDay.end = horarioInline.end || currentDay.end;
      return;
    }

    if (isObservationLine(line)) {
      currentDay.observations.add(line);
      return;
    }

    if (isPrelightLine(line)) {
      const precall = parsePrelightTime(line);
      if (precall) currentDay.precall = precall;
      return;
    }

    if (isTrasladoLine(line)) {
      const text = lastSeqId
        ? `Traslado (después de sec ${lastSeqId})`
        : 'Traslado (inicio del día)';
      currentDay.transport.push(text);
      return;
    }

    if (isSequenceLine(line)) {
      const match = line.match(/^\s*(\d{1,3}(?:\.\d{1,2}[A-Z]?)?)(?:\s+|:)\s*(.+)$/);
      if (!match) return;
      const id = match[1];
      const title = sanitizeSequenceTitle(match[2].trim());
      const label = `${id} ${title}`.trim();
      const location =
        extractLocationFromTitle(match[2].trim()) ||
        currentDay.locationContext ||
        undefined;
      currentDay.sequences.push({ id, label, location });
      lastSeqId = id;
      return;
    }

    if (!currentDay.defaultLocation && currentDay.sequences.length === 0) {
      const clean = normalize(line);
      const isUpper = clean && clean === clean.toUpperCase();
      if ((isUpper || /[()]/.test(clean)) && !/\b(INT|EXT|I\/E)\b/i.test(clean)) {
        const location = extractLocation(line);
        if (location) {
          currentDay.defaultLocation = location;
          currentDay.locationContext = location;
          return;
        }
      }
    }

    if (currentDay.sequences.length > 0) {
      const lastSeq = currentDay.sequences[currentDay.sequences.length - 1];
      if (isCityOverrideLine(line)) {
        const override = extractCityOverride(line);
        if (override) {
          if (currentDay.defaultLocation) {
            currentDay.defaultLocation = combineLocationWithCity(currentDay.defaultLocation, override);
          } else if (lastSeq.location) {
            lastSeq.location = combineLocationWithCity(lastSeq.location, override);
          } else {
            lastSeq.location = override;
          }
          return;
        }
      }
      if (!lastSeq.location) {
        const seqLocation = extractSequenceLocationLine(line);
        if (seqLocation) {
          lastSeq.location = seqLocation;
          return;
        }
        const location = extractLocation(line);
        if (location) {
          lastSeq.location = location;
          return;
        }
      }
    }

    if (currentDay.sequences.length > 0) {
      const context = extractLocationContext(line, profile);
      if (context) {
        currentDay.locationContext = context;
        return;
      }
    }

    if (isNoiseLine(line)) return;
  });

  finalizeDay();

  const weekMap = new Map<string, ImportWeek>();
  parsedDays.forEach(day => {
    const scope: ImportScope =
      (day as any).weekLabel?.includes('-') ? 'pre' : 'pro';
    const key = `${scope}_${day.weekStart}`;
    const existing = weekMap.get(key);
    const label = (day as any).weekLabel || undefined;
    const week = existing || {
      startDate: day.weekStart,
      label,
      scope,
      days: {},
    };
    week.days[day.dayIndex] = day;
    weekMap.set(key, week);
  });

  return {
    weeks: Array.from(weekMap.values()),
    warnings,
  };
}
