import { mondayOf, parseYYYYMMDD, toYYYYMMDD } from '@shared/utils/date';
import { ImportDay, ImportResult, ImportScope, ImportSequence, ImportWeek } from '../types';
import { extractCalendarDates, extractDayStart, extractWeekLabel, extractYear } from './extractors/dates';
import {
  buildLocationSequencesText,
  combineLocationWithCity,
  extractCityOverride,
  extractLocation,
  extractLocationContext,
  extractLocationFromTitle,
  extractSequenceLocationLine,
  isCityOverrideLine,
} from './extractors/locations';
import { isNoiseLine } from './extractors/noise';
import { isObservationLine, isPrelightLine, isTrasladoLine, parsePrelightTime } from './extractors/observations';
import { detectProfile } from './extractors/profile';
import { extractAnyHorarioRange, extractHorario, extractHorarioRanges } from './extractors/schedule';
import { isSequenceLine, sanitizeSequenceTitle } from './extractors/sequences';
import { normalize } from './extractors/text';

export function parsePlanText(text: string): ImportResult {
  const rawLines = text.split('\n').map(normalize).filter(Boolean);
  const profile = detectProfile(rawLines);
  const year = extractYear(rawLines);
  const warnings: string[] = [];
  let dayStartCount = 0;
  let scheduleLineCount = 0;
  let scheduleWithoutDayCount = 0;
  let calendarDatesCount = 0;
  const scheduleSamples: string[] = [];
  const scheduleRangesByLine: Array<{ lineIndex: number; start?: string; end?: string }> = [];
  let pendingSchedule: { start?: string; end?: string; kind?: 'labeled' | 'range'; lineIndex: number } | null =
    null;
  const pendingScheduleQueue: Array<{ start?: string; end?: string; kind?: 'labeled' | 'range'; lineIndex: number }> =
    [];
  const pendingDatesQueue: string[] = [];
  let currentCalendarDate: string | null = null;
  let currentWeekLabel: string | null = null;
  let currentDay: {
    dateISO: string;
    start?: string;
    end?: string;
    weekLabel?: string;
    precall?: string;
    defaultLocation?: string;
    locationContext?: string;
    startLineIndex?: number;
    calendarColumnIndex?: number;
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
    const date = parseYYYYMMDD(currentDay.dateISO);
    const calendarIndex =
      typeof currentDay.calendarColumnIndex === 'number'
        ? Math.max(0, Math.min(6, currentDay.calendarColumnIndex))
        : null;
    const weekStartDate = calendarIndex !== null ? new Date(date.getTime() - calendarIndex * 86400000) : mondayOf(date);
    const weekStart = toYYYYMMDD(weekStartDate);
    const dayIndex =
      calendarIndex !== null
        ? calendarIndex
        : Math.floor(
            (date.getTime() - parseYYYYMMDD(weekStart).getTime()) / (1000 * 60 * 60 * 24)
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

  const splitMultiDayLine = (line: string) => {
    const matches = line.match(/D[IÍ]A\s+\d+/gi);
    if (!matches || matches.length < 2) return [line];
    return line
      .split(/(?=D[IÍ]A\s+\d+)/i)
      .map(part => part.trim())
      .filter(Boolean);
  };

  const processLine = (line: string, index: number) => {
    const colMatch = line.match(/\[COL:(\d+)\]/);
    const calendarColumnIndex = colMatch ? Number(colMatch[1]) : undefined;
    const cleanLine = colMatch ? line.replace(colMatch[0], '').trim() : line;
    const scheduleRanges = extractHorarioRanges(cleanLine);
    if (scheduleRanges.length > 0) {
      scheduleLineCount += 1;
      if (!currentDay) scheduleWithoutDayCount += 1;
      if (scheduleSamples.length < 5) scheduleSamples.push(cleanLine);
      const primaryRange = scheduleRanges[0];
      scheduleRangesByLine.push({
        lineIndex: index,
        start: primaryRange?.start,
        end: primaryRange?.end,
      });
      if (!currentDay && !/(preparaci[oó]n|bocata|comida|lunch|dinner|break)/i.test(cleanLine)) {
        const queued = scheduleRanges.map(item => ({ ...item, lineIndex: index }));
        pendingScheduleQueue.push(...queued);
        pendingSchedule = { ...queued[queued.length - 1], lineIndex: index };
      }
      if (currentDay && !currentDay.start && !currentDay.end) {
        const queued = scheduleRanges.map(item => ({ ...item, lineIndex: index }));
        pendingScheduleQueue.push(...queued.slice(1));
        const next = queued[0] || pendingScheduleQueue.shift() || pendingSchedule;
        currentDay.start = next?.start || currentDay.start;
        currentDay.end = next?.end || currentDay.end;
      }
      if (!currentDay && pendingDatesQueue.length > 0) {
        scheduleRanges.forEach(range => {
          const dateISO = pendingDatesQueue.shift();
          if (!dateISO) return;
          finalizeDay();
          currentDay = {
            dateISO,
            start: range.start,
            end: range.end,
            weekLabel: currentWeekLabel || undefined,
            precall: undefined,
            defaultLocation: undefined,
            locationContext: undefined,
            startLineIndex: index,
            calendarColumnIndex,
            sequences: [],
            observations: new Set(),
            transport: [],
          };
          finalizeDay();
          currentDay = null;
        });
        return;
      }
    }

    const weekLabel = extractWeekLabel(cleanLine);
    if (weekLabel) {
      currentWeekLabel = weekLabel;
      return;
    }

    const dayStart = extractDayStart(cleanLine, year);
    if (dayStart) {
      dayStartCount += 1;
      finalizeDay();
      const hasHorarioLabel = /\b(HORARIO|SHOOTING\s+TIME|UNIT\s+CALL|CALL\s+TIME|H)\b/i.test(cleanLine);
      const inlineRangeFromPrefix =
        dayStart.start || dayStart.end ? null : extractAnyHorarioRange(cleanLine.slice(0, 60));
      const inlineRange =
        dayStart.start || dayStart.end || (!hasHorarioLabel && !inlineRangeFromPrefix)
          ? null
          : (inlineRangeFromPrefix || extractAnyHorarioRange(cleanLine));
      currentDay = {
        dateISO: dayStart.dateISO,
        start: inlineRange?.start || dayStart.start,
        end: inlineRange?.end || dayStart.end,
        weekLabel: currentWeekLabel || undefined,
        precall: undefined,
        defaultLocation: undefined,
        locationContext: undefined,
        startLineIndex: index,
        calendarColumnIndex,
        sequences: [],
        observations: new Set(),
        transport: [],
      };
      if (!currentDay.start && !currentDay.end && (pendingScheduleQueue.length > 0 || pendingSchedule)) {
        const next = pendingScheduleQueue.shift() || pendingSchedule;
        currentDay.start = next?.start || currentDay.start;
        currentDay.end = next?.end || currentDay.end;
        pendingSchedule = null;
      }
      lastSeqId = '';
      return;
    }

    const dates = scheduleRanges.length > 0 && profile !== 'calendar' ? [] : extractCalendarDates(cleanLine, year);
    calendarDatesCount += dates.length;
    if (profile === 'calendar' && dates.length > 0 && scheduleRanges.length === 0) {
      const nonDate = cleanLine.replace(/[0-9\/-\s]/g, ' ').trim();
      const isDateRow =
        nonDate.length === 0 ||
        /\bWEEK\b/i.test(cleanLine) ||
        nonDate.split(/\s+/).length <= 3;
      if (isDateRow) {
        if (dates.length > 1) {
          pendingDatesQueue.push(...dates);
          currentCalendarDate = null;
        } else {
          currentCalendarDate = dates[0];
        }
        return;
      }
    }
    if (dates.length >= 4) {
      pendingDatesQueue.push(...dates);
      if (pendingScheduleQueue.length > 0 || pendingSchedule) {
        dates.forEach(dateISO => {
          finalizeDay();
          currentDay = {
            dateISO,
            start: undefined,
            end: undefined,
            weekLabel: currentWeekLabel || undefined,
            precall: undefined,
            defaultLocation: undefined,
            locationContext: undefined,
            startLineIndex: index,
            calendarColumnIndex,
            sequences: [],
            observations: new Set(),
            transport: [],
          };
          const next = pendingScheduleQueue.shift() || pendingSchedule;
          currentDay.start = next?.start || currentDay.start;
          currentDay.end = next?.end || currentDay.end;
          pendingSchedule = null;
          finalizeDay();
        });
        currentDay = null;
        return;
      }
      if (scheduleRanges.length === 0) {
        return;
      }
    }

    if (profile === 'calendar') {
      if (!currentDay && scheduleRanges.length > 0) {
        const dateISO = pendingDatesQueue.shift() || currentCalendarDate;
        if (dateISO) {
          finalizeDay();
          currentDay = {
            dateISO,
            start: scheduleRanges[0]?.start,
            end: scheduleRanges[0]?.end,
            weekLabel: currentWeekLabel || undefined,
            precall: undefined,
            defaultLocation: undefined,
            locationContext: undefined,
            startLineIndex: index,
            calendarColumnIndex,
            sequences: [],
            observations: new Set(),
            transport: [],
          };
          currentCalendarDate = null;
          finalizeDay();
          currentDay = null;
          return;
        }
      }
      if (!currentDay && dates.length > 0 && scheduleRanges.length > 0) {
        dates.forEach(dateISO => {
          finalizeDay();
          currentDay = {
            dateISO,
            start: undefined,
            end: undefined,
            weekLabel: currentWeekLabel || undefined,
            precall: undefined,
            defaultLocation: undefined,
            locationContext: undefined,
            startLineIndex: index,
            calendarColumnIndex,
            sequences: [],
            observations: new Set(),
            transport: [],
          };
          const next = pendingScheduleQueue.shift() || pendingSchedule;
          currentDay.start = next?.start || currentDay.start;
          currentDay.end = next?.end || currentDay.end;
          pendingSchedule = null;
          finalizeDay();
        });
        currentDay = null;
        return;
      }
      if (dates.length === 1 && (/^\d{1,2}[\/-]\d{1,2}$/.test(line) || /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(line))) {
        finalizeDay();
        currentDay = {
          dateISO: dates[0],
          start: undefined,
          end: undefined,
          weekLabel: currentWeekLabel || undefined,
          precall: undefined,
          defaultLocation: undefined,
          locationContext: undefined,
          startLineIndex: index,
          calendarColumnIndex,
          sequences: [],
          observations: new Set(),
          transport: [],
        };
        if (pendingScheduleQueue.length > 0 || pendingSchedule) {
          const next = pendingScheduleQueue.shift() || pendingSchedule;
          currentDay.start = next?.start || currentDay.start;
          currentDay.end = next?.end || currentDay.end;
          pendingSchedule = null;
        }
        lastSeqId = '';
        return;
      }
      if (dates.length > 1 && (line.replace(/[0-9\/-\s]/g, '') === '' || dates.length >= 5)) {
        dates.forEach(dateISO => {
          finalizeDay();
          currentDay = {
            dateISO,
            start: undefined,
            end: undefined,
            weekLabel: currentWeekLabel || undefined,
            precall: undefined,
            defaultLocation: undefined,
            locationContext: undefined,
            startLineIndex: index,
            calendarColumnIndex,
            sequences: [],
            observations: new Set(),
            transport: [],
          };
          if (pendingScheduleQueue.length > 0 || pendingSchedule) {
            const next = pendingScheduleQueue.shift() || pendingSchedule;
            currentDay.start = next?.start || currentDay.start;
            currentDay.end = next?.end || currentDay.end;
            pendingSchedule = null;
          }
          finalizeDay();
        });
        currentDay = null;
        return;
      }
    }

    if (!currentDay) return;

    const horarioInline = extractHorario(cleanLine);
    if (horarioInline.start || horarioInline.end) {
      if (/(preparaci[oó]n|bocata|comida|lunch|dinner|break)/i.test(cleanLine)) return;
      if (horarioInline.kind === 'range') {
        if (currentDay.start || currentDay.end) return;
      }
      currentDay.start = horarioInline.start || currentDay.start;
      currentDay.end = horarioInline.end || currentDay.end;
      return;
    }

    if (isObservationLine(cleanLine)) {
      currentDay.observations.add(cleanLine);
      return;
    }

    if (isPrelightLine(cleanLine)) {
      const precall = parsePrelightTime(cleanLine);
      if (precall) currentDay.precall = precall;
      return;
    }

    if (isTrasladoLine(cleanLine)) {
      const text = lastSeqId
        ? `Traslado (después de sec ${lastSeqId})`
        : 'Traslado (inicio del día)';
      currentDay.transport.push(text);
      return;
    }

    if (isSequenceLine(cleanLine)) {
      const match = cleanLine.match(/^\s*(\d{1,3}(?:\.\d{1,2}[A-Z]?)?)(?:\s+|:)\s*(.+)$/);
      if (!match) return;
      const id = match[1];
      const title = sanitizeSequenceTitle(match[2].trim());
      const label = `${id} ${title}`.trim();
      const location = extractLocationFromTitle(match[2].trim()) || currentDay.locationContext || undefined;
      currentDay.sequences.push({ id, label, location });
      lastSeqId = id;
      return;
    }

    if (!currentDay.defaultLocation && currentDay.sequences.length === 0) {
      const clean = normalize(cleanLine);
      const isUpper = clean && clean === clean.toUpperCase();
      if ((isUpper || /[()]/.test(clean)) && !/\b(INT|EXT|I\/E)\b/i.test(clean)) {
        const location = extractLocation(cleanLine);
        if (location) {
          currentDay.defaultLocation = location;
          currentDay.locationContext = location;
          return;
        }
      }
    }

    if (currentDay.sequences.length > 0) {
      const lastSeq = currentDay.sequences[currentDay.sequences.length - 1];
      if (isCityOverrideLine(cleanLine)) {
        const override = extractCityOverride(cleanLine);
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
        const seqLocation = extractSequenceLocationLine(cleanLine);
        if (seqLocation) {
          lastSeq.location = seqLocation;
          return;
        }
        const location = extractLocation(cleanLine);
        if (location) {
          lastSeq.location = location;
          return;
        }
      }
    }

    if (currentDay.sequences.length > 0) {
      const context = extractLocationContext(cleanLine, profile);
      if (context) {
        currentDay.locationContext = context;
        return;
      }
    }

    if (isNoiseLine(cleanLine)) return;
  };

  rawLines.forEach((line, index) => {
    const segments = splitMultiDayLine(line);
    segments.forEach(segment => processLine(segment, index));
  });

  finalizeDay();

  const assignedScheduleCount = parsedDays.filter(day => Boolean(day.crewStart) || Boolean(day.crewEnd)).length;
  const shouldBackfill =
    parsedDays.length > 0 &&
    scheduleRangesByLine.length > 0 &&
    assignedScheduleCount < Math.min(3, scheduleRangesByLine.length);
  if (shouldBackfill) {
    const orderedRanges = scheduleRangesByLine
      .filter(range => range.start || range.end)
      .sort((a, b) => a.lineIndex - b.lineIndex);
    let scheduleIndex = 0;
    parsedDays.forEach(day => {
      if (day.crewStart || day.crewEnd) return;
      const next = orderedRanges[scheduleIndex++];
      if (!next) return;
      day.crewStart = next.start;
      day.crewEnd = next.end;
      day.crewTipo = day.crewTipo || 'Rodaje';
    });
  }

  if (dayStartCount === 0 && calendarDatesCount === 0) {
    warnings.push('No se detectaron líneas de día/fecha.');
  }
  if (scheduleLineCount === 0) {
    warnings.push('No se detectaron líneas de horario.');
  }
  if (scheduleWithoutDayCount > 0) {
    warnings.push(`Horarios sin día activo: ${scheduleWithoutDayCount}.`);
  }
  // Keep warnings focused on user-relevant issues (no debug/diagnostic lines).

  const weekMap = new Map<string, ImportWeek>();
  const hasDaySchedule = (day: ImportDay) => Boolean(day.crewStart) || Boolean(day.crewEnd);
  const hasDayContent = (day: ImportDay) =>
    hasDaySchedule(day) ||
    Boolean(day.locationSequencesText) ||
    Boolean(day.transportText) ||
    Boolean(day.observationsText) ||
    Boolean(day.precall) ||
    (day.sequences && day.sequences.length > 0);

  parsedDays.forEach(day => {
    const scope: ImportScope = (day as any).weekLabel?.includes('-') ? 'pre' : 'pro';
    const key = `${scope}_${day.weekStart}`;
    const existing = weekMap.get(key);
    const label = (day as any).weekLabel || undefined;
    const week = existing || {
      startDate: day.weekStart,
      label,
      scope,
      days: {},
    };
    const current = week.days[day.dayIndex];
    if (!current) {
      week.days[day.dayIndex] = day;
    } else {
      const keepCurrent =
        (hasDaySchedule(current) && !hasDaySchedule(day)) ||
        (hasDayContent(current) && !hasDayContent(day));
      week.days[day.dayIndex] = keepCurrent ? current : day;
    }
    weekMap.set(key, week);
  });

  return {
    weeks: Array.from(weekMap.values()),
    warnings,
  };
}
