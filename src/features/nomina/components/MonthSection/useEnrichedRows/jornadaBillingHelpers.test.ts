import { describe, expect, it } from 'vitest';

import {
  buildPriceSegmentKey,
  calculateSegmentJornadaEuro,
  mergePriceSegments,
  recalculateMergedRowTotals,
  sumSemanalJornadaBillableDays,
  sumSegmentsJornadaEuro,
} from './jornadaBillingHelpers';

describe('jornadaBillingHelpers', () => {
  it('sums only billable jornada types (excludes sexto día)', () => {
    expect(
      sumSemanalJornadaBillableDays({
        rodaje: 15,
        carga: 4,
        sextoDia: 3,
      })
    ).toBe(19);
  });

  it('merges segments by role and sums breakdown', () => {
    const merged = mergePriceSegments(
      [
        {
          segmentKey: 'bb_default',
          roleForPriceLookup: 'BB',
          breakdown: { rodaje: 11 },
          effectivePr: { jornada: 320 },
        },
      ],
      [
        {
          segmentKey: 'e_default',
          roleForPriceLookup: 'E',
          breakdown: { rodaje: 8 },
          effectivePr: { jornada: 270 },
        },
      ]
    );

    expect(merged).toHaveLength(2);
    expect(sumSegmentsJornadaEuro(merged)).toBe(11 * 320 + 8 * 270);
  });

  it('recalculateMergedRowTotals aligns total jornadas with billable days × price', () => {
    const row: Record<string, unknown> = {
      _priceSegments: [
        {
          segmentKey: 'bb_default',
          roleForPriceLookup: 'BB',
          breakdown: { rodaje: 15, carga: 4 },
          effectivePr: { jornada: 320, sextoDia: 300, halfJornada: 0, travelDay: 0, holidayDay: 0, horaExtra: 0, transporte: 0, km: 0 },
        },
      ],
      _halfDays: 0,
      _travel: 0,
      _holidays: 0,
      horasExtra: 0,
      turnAround: 0,
      nocturnidad: 0,
      penaltyLunch: 0,
      transporte: 0,
      km: 0,
      gasolina: 0,
      _totalDietas: 0,
      _sextoDia: 3,
      _totalSextoDia: 999,
      _totalBruto: 99999,
    };

    recalculateMergedRowTotals(row, 'semanal');

    expect(row._worked).toBe(19);
    expect(row._totalDias).toBe(19 * 320);
    expect(row._totalSextoDia).toBe(0);
    expect(row._totalBruto).toBe(19 * 320);
  });

  it('buildPriceSegmentKey prefers roleId', () => {
    expect(buildPriceSegmentKey('bb_default', 'BB')).toBe('bb_default');
    expect(buildPriceSegmentKey(null, 'BB')).toBe('BB');
  });

  it('calculateSegmentJornadaEuro uses breakdown only', () => {
    expect(
      calculateSegmentJornadaEuro({
        segmentKey: 'e_default',
        roleForPriceLookup: 'E',
        breakdown: { rodaje: 11, sextoDia: 5 },
        effectivePr: { jornada: 270 },
        workedDaysFallback: 16,
      })
    ).toBe(11 * 270);
  });
});
