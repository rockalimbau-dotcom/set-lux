const OBSERVATION_TAGS = [
  'equipo reducido',
  'vuelta a barcelona',
  'viaje a madrid',
];

export const isObservationLine = (line: string) => {
  const lower = line.toLowerCase();
  return OBSERVATION_TAGS.some(tag => lower.includes(tag));
};

export const isTrasladoLine = (line: string) => /traslado|trasllat/i.test(line);

export const isPrelightLine = (line: string) => /prelight\s+\d+/i.test(line);

export const parsePrelightTime = (line: string) => {
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
