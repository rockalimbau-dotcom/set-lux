import { describe, it, expect } from 'vitest';
import { buildCondParams, DEFAULTS_BY_MODE } from '../utils/runtime';

describe('useCondParams (condiciones → reportes)', () => {
  it('buildCondParams applies jornada from stored cond model', () => {
    const params = buildCondParams(
      { jornadaTrabajo: '10', jornadaComida: '1' },
      DEFAULTS_BY_MODE.semanal
    );
    expect(params.jornadaTrabajo).toBe(10);
    expect(params.jornadaComida).toBe(1);
  });

  it('defaults to 9+1 semanal when params missing', () => {
    const params = buildCondParams({}, DEFAULTS_BY_MODE.semanal);
    expect(params.jornadaTrabajo).toBe(9);
    expect(params.jornadaComida).toBe(1);
  });
});
