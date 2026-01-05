import { AutoCalculationsParams } from './useAutoCalculationsTypes';

/**
 * Calcula si un turno tiene nocturnidad
 */
export function calculateNocturnidad(
  start: string,
  end: string,
  params: AutoCalculationsParams
): boolean {
  const startM = (t: string) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
  const iniMin = startM(start);
  const finMin = startM(end);
  const thIni = startM(params.nocturnoIni || '22:00');
  const thFin = startM(params.nocturnoFin || '06:00');

  if (isNaN(iniMin) || isNaN(finMin)) return false;
  if (iniMin >= thIni || finMin >= thIni) return true;
  if (iniMin < thFin || finMin < thFin) return true;
  return false;
}

