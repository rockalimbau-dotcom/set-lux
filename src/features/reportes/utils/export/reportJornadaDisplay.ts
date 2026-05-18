export function normalizeJornadaToneKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Etiqueta de descanso del trabajador (ES/EN/CA: DESCANSO, REST, DESCANS, etc.). */
export function isRestJornadaLabel(jornadaType: string): boolean {
  const normalized = normalizeJornadaToneKey(jornadaType);
  if (!normalized) return false;
  return (
    normalized === 'rest' ||
    normalized === 'descanso' ||
    normalized === 'descans' ||
    normalized.includes('descans')
  );
}

export function formatJornadaCellForExport(jornadaType: string, schedule: string): string {
  const safeType = String(jornadaType || '').trim();
  const safeSchedule = String(schedule || '').trim();

  if (isRestJornadaLabel(safeType)) return safeType;
  if (!safeType) return safeSchedule;
  if (!safeSchedule) return safeType;

  const normalizedType = safeType.toLowerCase();
  const normalizedSchedule = safeSchedule.toLowerCase();

  if (normalizedSchedule === normalizedType) return safeType;
  if (normalizedSchedule.startsWith(`${normalizedType}:`)) {
    const stripped = safeSchedule.slice(safeType.length + 1).trim();
    return stripped ? `${safeType} | ${stripped}` : safeType;
  }

  return `${safeType} | ${safeSchedule}`;
}
