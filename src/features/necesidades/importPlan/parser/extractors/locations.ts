import { ImportSequence } from '../../types';
import { PlanProfile } from './profile';
import { normalize } from './text';

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

export const isCityOverrideLine = (line: string) => {
  const clean = line.replace(/[0-9]/g, '').trim();
  if (!clean) return false;
  if (CAPS_IGNORE.has(clean)) return false;
  const isUpper = clean === clean.toUpperCase();
  const wordCount = clean.split(/\s+/).length;
  return isUpper && wordCount <= 3;
};

export const extractCityOverride = (line: string) =>
  normalize(line.split(',')[0]).replace(/[0-9]/g, '').trim();

export const combineLocationWithCity = (location: string, city: string) => {
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

export const extractLocationFromTitle = (title: string) => {
  const match = title.match(/\b(INT|EXT|I\/E)\b\s*(.+)$/i);
  if (!match) return null;
  const candidate = normalize(match[2]);
  if (!candidate) return null;
  if (SHORT_LOC_TOKENS.has(candidate.toUpperCase())) return null;
  if (!isLocationCandidate(candidate)) return null;
  return candidate;
};

export const extractSequenceLocationLine = (line: string) => {
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

export const extractLocation = (line: string) => {
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

const shouldAcceptLocationText = (text: string, minWords: number) => {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < minWords) return false;
  if (wordCount > 8 && !/[()/]/.test(text)) return false;
  return true;
};

export const extractLocationContext = (line: string, profile: PlanProfile) => {
  if (isCityOverrideLine(line)) return null;
  if (isLocationIgnoreLine(line)) return null;
  const minWords = profile === 'calendar' ? 2 : 1;
  const seqLoc = extractSequenceLocationLine(line);
  if (seqLoc && shouldAcceptLocationText(seqLoc, minWords)) return seqLoc;
  const loc = extractLocation(line);
  if (loc && shouldAcceptLocationText(loc, minWords)) return loc;
  return null;
};

export const buildLocationSequencesText = (sequences: ImportSequence[], defaultLocation?: string) => {
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
