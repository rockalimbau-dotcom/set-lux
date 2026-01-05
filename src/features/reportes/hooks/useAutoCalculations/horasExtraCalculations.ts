import { diffMinutes } from '../../utils/numbers';
import {
  calcHorasExtraMinutajeDesdeCorte,
  calcHorasExtraMinutajeConCortesia,
  formatHorasExtraDecimal,
} from '../../utils/runtime';

interface HorasExtraParams {
  start: string | null;
  end: string | null;
  iso: string;
  baseHours: number;
  cortes: number;
  horasExtraTipo: string;
  calcHorasExtraMin: (workedMin: number, baseHours: number, cortes: number) => number;
  buildDateTime: (iso: string, time: string) => Date | null;
}

/**
 * Calcula las horas extra para un bloque
 */
export function calculateHorasExtra({
  start,
  end,
  iso,
  baseHours,
  cortes,
  horasExtraTipo,
  calcHorasExtraMin,
  buildDateTime,
}: HorasExtraParams): number | string {
  if (!end) return 0;

  let workedMin = 0;
  const sDT = buildDateTime(iso, start!);
  let eDT = buildDateTime(iso, end);

  if (sDT && eDT) {
    if (eDT <= sDT) eDT = new Date(eDT.getTime() + 24 * 60 * 60 * 1000);
    workedMin = Math.max(0, Math.round((eDT.getTime() - sDT.getTime()) / 60000));
  } else {
    workedMin = Number(diffMinutes(start!, end) || 0);
  }

  // Calcular horas extra según el tipo seleccionado
  if (horasExtraTipo === 'Hora Extra - Minutaje desde corte') {
    const extraDecimal = calcHorasExtraMinutajeDesdeCorte(workedMin, baseHours);
    return extraDecimal > 0 ? formatHorasExtraDecimal(extraDecimal) : '';
  } else if (horasExtraTipo === 'Hora Extra - Minutaje + Cortesía') {
    const extraDecimal = calcHorasExtraMinutajeConCortesia(workedMin, baseHours, cortes);
    return extraDecimal > 0 ? formatHorasExtraDecimal(extraDecimal) : '';
  } else {
    // Hora Extra - Normal (comportamiento original)
    return calcHorasExtraMin(workedMin, baseHours, cortes);
  }
}

