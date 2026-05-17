import { describe, expect, it } from 'vitest';

import {
  FACTOR_SEXTO_DIA,
  PRICE_KEY_FESTIVO,
  PRICE_KEY_SEXTO_DIA,
  PRICE_KEY_SEXTO_DIA_HALF,
} from '../shared/priceKeys';
import { computeFromWeekly } from './semanalUtils';

describe('computeFromWeekly', () => {
  it('calculates festivos and sexto día from weekly price', () => {
    const derived = computeFromWeekly('500', {
      semanasMes: 4,
      diasDiario: 7,
      diasJornada: 5,
      factorFestivo: 1.75,
      divTravel: 2,
      horasSemana: 45,
      factorHoraExtra: 1.5,
    });

    expect(derived['Precio jornada']).toBe('100');
    expect(derived['Precio 1/2 jornada']).toBe('50');
    expect(derived[PRICE_KEY_FESTIVO]).toBe('175');
    expect(derived[PRICE_KEY_SEXTO_DIA]).toBe(String(100 * FACTOR_SEXTO_DIA));
    expect(derived[PRICE_KEY_SEXTO_DIA_HALF]).toBe(String(50 * FACTOR_SEXTO_DIA));
  });
});
