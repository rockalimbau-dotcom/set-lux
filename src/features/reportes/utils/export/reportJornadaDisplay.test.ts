import { describe, it, expect } from 'vitest';
import { formatJornadaCellForExport, isRestJornadaLabel } from './reportJornadaDisplay';

describe('reportJornadaDisplay', () => {
  it('detects rest labels in ES, EN and CA', () => {
    expect(isRestJornadaLabel('DESCANSO')).toBe(true);
    expect(isRestJornadaLabel('REST')).toBe(true);
    expect(isRestJornadaLabel('Rest')).toBe(true);
    expect(isRestJornadaLabel('DESCANS')).toBe(true);
    expect(isRestJornadaLabel('Descanso')).toBe(true);
  });

  it('does not treat working day types as rest', () => {
    expect(isRestJornadaLabel('Rodaje')).toBe(false);
    expect(isRestJornadaLabel('Loading')).toBe(false);
    expect(isRestJornadaLabel('Camera tests')).toBe(false);
  });

  it('shows only rest label without block schedule', () => {
    expect(formatJornadaCellForExport('REST', 'Loading | 08:45-20:00')).toBe('REST');
    expect(formatJornadaCellForExport('DESCANSO', 'Rodaje | 08:00-19:00')).toBe('DESCANSO');
  });

  it('keeps jornada and schedule for working days', () => {
    expect(formatJornadaCellForExport('Loading', '08:45-20:00')).toBe('Loading | 08:45-20:00');
  });
});
