import { describe, it, expect } from 'vitest';
import { 
  FESTIVOS_CATALUNYA_2025_FALLBACK as FESTIVOS_CATALUNYA_2025,
  generateFestivosText, 
  isFestivo, 
  DEFAULT_FESTIVOS_TEXT 
} from './festivos';

describe('Festivos Constants', () => {
  it('should have correct number of festivos', () => {
    expect(FESTIVOS_CATALUNYA_2025).toHaveLength(13);
  });

  it('should generate correct festivos text', () => {
    const text = generateFestivosText(FESTIVOS_CATALUNYA_2025);
    expect(text).toContain('La jornada y horas en días festivos tendrán un incremento del 75%');
    expect(text).toContain('Festivos 2025');
    expect(text).toContain('01/01'); // Año Nuevo
    expect(text).toContain('25/12'); // Navidad
  });

  it('should detect festivos correctly', () => {
    expect(isFestivo('2025-01-01', FESTIVOS_CATALUNYA_2025)).toBe(true); // Año Nuevo
    expect(isFestivo('2025-12-25', FESTIVOS_CATALUNYA_2025)).toBe(true); // Navidad
    expect(isFestivo('2025-09-11', FESTIVOS_CATALUNYA_2025)).toBe(true); // Diada
    expect(isFestivo('2025-01-02', FESTIVOS_CATALUNYA_2025)).toBe(false); // Día normal
    expect(isFestivo('2025-06-15', FESTIVOS_CATALUNYA_2025)).toBe(false); // Día normal
  });

  it('should have default text generated correctly', () => {
    expect(DEFAULT_FESTIVOS_TEXT).toContain('La jornada y horas en días festivos');
    expect(DEFAULT_FESTIVOS_TEXT).toContain('75%');
  });
});
