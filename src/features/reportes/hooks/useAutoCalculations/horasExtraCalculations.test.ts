import { describe, it, expect } from 'vitest';
import { calculateHorasExtra } from './horasExtraCalculations';
import { buildDateTime, calcHorasExtraMin } from '../../utils/runtime';

describe('calculateHorasExtra', () => {
  it('08:00–19:00 con jornada 10+1 no genera hora extra (modo normal)', () => {
    const result = calculateHorasExtra({
      start: '08:00',
      end: '19:00',
      iso: '2026-05-25',
      baseHours: 11,
      cortes: 15,
      horasExtraTipo: 'Hora Extra - Normal',
      calcHorasExtraMin,
      buildDateTime,
    });
    expect(result).toBe(0);
  });

  it('08:00–19:00 con jornada 9+1 sí genera 1h extra (modo normal)', () => {
    const result = calculateHorasExtra({
      start: '08:00',
      end: '19:00',
      iso: '2026-05-25',
      baseHours: 10,
      cortes: 15,
      horasExtraTipo: 'Hora Extra - Normal',
      calcHorasExtraMin,
      buildDateTime,
    });
    expect(result).toBe(1);
  });
});
