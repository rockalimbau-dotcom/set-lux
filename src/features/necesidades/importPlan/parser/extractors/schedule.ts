export const normalizeTime = (raw?: string) => {
  if (!raw) return '';
  const compact = raw.toLowerCase().replace(/\s+/g, '').trim();
  const withColon = compact
    .replace(/(\d{1,2})h(\d{2})/g, '$1:$2')
    .replace(/(\d{1,2})h\b/g, '$1:00')
    .replace(/[hH]/g, '')
    .replace(/[.,']/g, ':');
  const cleaned = withColon.replace(/[^0-9:]/g, '');
  const [hh, mm] = cleaned.split(':');
  if (!hh) return '';
  return `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')}`;
};

const TIME_TOKEN = '\\d{1,2}(?:[.:,]\\d{2}h?|h\\d{2}|h)?';
const RANGE_PATTERN = new RegExp(
  `(${TIME_TOKEN})\\s*h?\\s*(?:[-–]|\\bto\\b|\\ba\\b)\\s*(${TIME_TOKEN})\\s*h?\\??`,
  'gi'
);

const isHorarioLabelLine = (line: string) =>
  /\b(HORARIO|SHOOTING\s+TIME|UNIT\s+CALL|CALL\s+TIME|H)\b/i.test(line);

const extractTimeRange = (line: string) => {
  const rangeMatch = line.match(
    /(\d{1,2})(?:[.:](\d{2}))?\s*h?\s*[-–a]\s*(\d{1,2})(?:[.:](\d{2}))?\s*h?\??/i
  );
  if (!rangeMatch) return {};
  const start = `${rangeMatch[1]}:${rangeMatch[2] || '00'}`;
  const end = `${rangeMatch[3]}:${rangeMatch[4] || '00'}`;
  return {
    start: normalizeTime(start),
    end: normalizeTime(end),
  };
};

const isStandaloneRangeLine = (line: string, rangePattern: RegExp) => {
  const withoutRange = line.replace(rangePattern, ' ');
  const withoutParens = withoutRange.replace(/\([^)]*\)/g, ' ');
  const cleaned = withoutParens
    .toLowerCase()
    .replace(/[\s,.;:+-]+/g, ' ')
    .replace(
      /\b(tbc|aprox|approx|ot|included|lunch|dinner|break|prep|shooting|time|horario|prd|rodaje|jornada|dia|día|hrs|hs)\b/g,
      ' '
    )
    .replace(/\b\d{1,2}\s*\+\s*\d{1,2}\b/g, ' ')
    .trim();
  return cleaned.length === 0;
};

export const extractHorario = (line: string) => {
  const labeledMatch = line.match(
    /(?:SHOOTING\s+TIME|HORARIO|UNIT\s+CALL|CALL\s+TIME|H)\s*[:.]?\s*(?:APROX\.)?[^0-9]*([0-9:.h]+)\s*(?:h)?\s*[-–a]\s*([0-9:.h]+)/i
  );
  if (labeledMatch) {
    return {
      start: normalizeTime(labeledMatch[1]),
      end: normalizeTime(labeledMatch[2]),
      kind: 'labeled' as const,
    };
  }

  if (!isStandaloneRangeLine(line, RANGE_PATTERN)) {
    return {};
  }
  const rangeMatch = line.match(RANGE_PATTERN);
  if (!rangeMatch) return {};
  const [first] = Array.from(line.matchAll(RANGE_PATTERN));
  if (!first) return {};
  const start = normalizeTime(first[1]);
  const end = normalizeTime(first[2]);
  return {
    start,
    end,
    kind: 'range' as const,
  };
};

export const extractHorarioRanges = (line: string) => {
  const labeledMatch = line.match(
    /(?:SHOOTING\s+TIME|HORARIO|UNIT\s+CALL|CALL\s+TIME|H)\s*[:.]?\s*(?:APROX\.)?[^0-9]*([0-9:.h]+)\s*(?:h)?\s*[-–a]\s*([0-9:.h]+)/i
  );
  if (labeledMatch) {
    return [
      {
        start: normalizeTime(labeledMatch[1]),
        end: normalizeTime(labeledMatch[2]),
        kind: 'labeled' as const,
      },
    ];
  }

  const matches = Array.from(line.matchAll(RANGE_PATTERN));
  if (matches.length === 0) return [];
  if (!isHorarioLabelLine(line) && !isStandaloneRangeLine(line, RANGE_PATTERN)) {
    return [];
  }
  return matches.map(match => ({
    start: normalizeTime(match[1]),
    end: normalizeTime(match[2]),
    kind: 'range' as const,
  }));
};

export const extractAnyHorarioRange = (line: string) => {
  const labeledMatch = line.match(
    /(?:SHOOTING\s+TIME|HORARIO|UNIT\s+CALL|CALL\s+TIME|H)\s*[:.]?\s*(?:APROX\.)?[^0-9]*([0-9:.h]+)\s*(?:h)?\s*[-–a]\s*([0-9:.h]+)/i
  );
  if (labeledMatch) {
    return {
      start: normalizeTime(labeledMatch[1]),
      end: normalizeTime(labeledMatch[2]),
      kind: 'labeled' as const,
    };
  }
  const matches = Array.from(line.matchAll(RANGE_PATTERN));
  if (matches.length === 0) return null;
  return {
    start: normalizeTime(matches[0][1]),
    end: normalizeTime(matches[0][2]),
    kind: 'range' as const,
  };
};
