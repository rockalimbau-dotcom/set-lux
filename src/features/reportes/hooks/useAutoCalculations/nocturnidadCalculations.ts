import { AutoCalculationsParams } from './useAutoCalculationsTypes';

/**
 * Calcula si un turno tiene nocturnidad
 */
export function calculateNocturnidad(
  start: string,
  end: string,
  params: AutoCalculationsParams
): boolean {
  const startM = (t: string) => {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
  };

  const iniMin = startM(start);
  const finMin = startM(end);
  const thIni = startM(params.nocturnoIni || '22:00');
  const thFin = startM(params.nocturnoFin || '06:00');

  if (isNaN(iniMin) || isNaN(finMin) || isNaN(thIni) || isNaN(thFin)) return false;

  const dayMin = 24 * 60;
  let shiftStart = iniMin;
  let shiftEnd = finMin;
  if (shiftEnd <= shiftStart) shiftEnd += dayMin;

  const overlaps = (a: number, b: number) => Math.max(shiftStart, a) < Math.min(shiftEnd, b);

  const intervals: Array<[number, number]> = [];
  if (thIni <= thFin) {
    intervals.push([thIni, thFin]);
    intervals.push([thIni + dayMin, thFin + dayMin]);
  } else {
    intervals.push([thIni, dayMin]);
    intervals.push([0, thFin]);
    intervals.push([thIni + dayMin, dayMin * 2]);
    intervals.push([dayMin, dayMin + thFin]);
  }

  return intervals.some(([a, b]) => overlaps(a, b));
}
