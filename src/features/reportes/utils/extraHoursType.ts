export type ExtraHoursMode = 'normal' | 'minutage_from_cut' | 'minutage_courtesy';

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

export function resolveExtraHoursMode(value: string): ExtraHoursMode {
  const normalized = normalize(value);
  if (!normalized) return 'normal';
  const isMinutage = normalized.includes('minut');
  if (!isMinutage) return 'normal';
  if (
    normalized.includes('cortesia') ||
    normalized.includes('cortesia') ||
    normalized.includes('courtesy')
  ) {
    return 'minutage_courtesy';
  }
  return 'minutage_from_cut';
}

export function isMinutageExtraHoursMode(value: string): boolean {
  return resolveExtraHoursMode(value) !== 'normal';
}
