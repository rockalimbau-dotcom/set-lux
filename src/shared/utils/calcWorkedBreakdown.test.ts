import { describe, it, expect, vi, beforeEach } from 'vitest';

import { calcWorkedBreakdown } from './calcWorkedBreakdown';

// Mock weekISOdays
vi.mock('@features/nomina/utils/plan', () => ({
  weekISOdays: vi.fn((week) => {
    // Return ISO days based on week structure
    const days = week?.days || [];
    return days.map((_: any, idx: number) => {
      const date = new Date(2024, 0, 1 + idx);
      return date.toISOString().split('T')[0];
    });
  }),
}));

describe('calcWorkedBreakdown', () => {
  const mockWeeks = [
    {
      days: [
        { tipo: 'Rodaje', team: [{ role: 'G', name: 'Juan' }] },
        { tipo: 'Oficina', team: [{ role: 'G', name: 'Juan' }] },
        { tipo: 'Travel Day', team: [{ role: 'G', name: 'Juan' }] },
        { tipo: 'Descanso' },
        { tipo: 'Rodaje Festivo', team: [{ role: 'G', name: 'Juan' }] },
        { tipo: 'Carga', team: [{ role: 'G', name: 'Juan' }] },
        { tipo: 'Descarga', team: [{ role: 'G', name: 'Juan' }] },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('semanal mode (default)', () => {
    it('calculates worked days correctly', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        () => true,
        { role: 'G', name: 'Juan' },
        'semanal'
      );

      // Rodaje, Oficina, Carga, Descarga cuentan como workedDays
      // Travel Day y Rodaje Festivo NO cuentan en workedDays
      expect(result.workedDays).toBe(4); // Rodaje + Oficina + Carga + Descarga
      expect(result.travelDays).toBe(1); // Travel Day
      expect(result.holidayDays).toBe(1); // Rodaje Festivo
    });

    it('excludes rest days', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        () => true,
        { role: 'G', name: 'Juan' },
        'semanal'
      );

      // Descanso no debe contar
      expect(result.workedDays).toBe(4);
    });

    it('respects filterISO', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        (iso) => iso === '2024-01-01', // Solo primer día
        { role: 'G', name: 'Juan' },
        'semanal'
      );

      expect(result.workedDays).toBe(1); // Solo Rodaje del primer día
    });

    it('stops counting at "Fin"', () => {
      const weeksWithFin = [
        {
          days: [
            { tipo: 'Rodaje', team: [{ role: 'G', name: 'Juan' }] },
            { tipo: 'Fin' },
            { tipo: 'Rodaje', team: [{ role: 'G', name: 'Juan' }] },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithFin,
        () => true,
        { role: 'G', name: 'Juan' },
        'semanal'
      );

      // Solo debe contar el primer Rodaje, no el que está después de "Fin"
      expect(result.workedDays).toBe(1);
    });
  });

  describe('publicidad mode', () => {
    it('only counts Rodaje and Oficina as workedDays', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        () => true,
        { role: 'G', name: 'Juan' },
        'publicidad'
      );

      // En publicidad, solo Rodaje y Oficina cuentan en workedDays
      expect(result.workedDays).toBe(2); // Rodaje + Oficina
      expect(result.travelDays).toBe(1); // Travel Day tiene su propia columna
      expect(result.rodaje).toBe(1);
      expect(result.oficina).toBe(1);
      expect(result.carga).toBe(1); // Tiene su propia columna
      expect(result.descarga).toBe(1); // Tiene su propia columna
    });
  });

  describe('person matching', () => {
    it('matches person by role and name', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        () => true,
        { role: 'G', name: 'Juan' },
        'semanal'
      );

      expect(result.workedDays).toBeGreaterThan(0);
    });

    it('does not count days when person is not in team', () => {
      const result = calcWorkedBreakdown(
        mockWeeks,
        () => true,
        { role: 'G', name: 'Pedro' }, // Persona que no está en el equipo
        'semanal'
      );

      expect(result.workedDays).toBe(0);
    });

    it('prioritizes personId when the same name exists with different tariffs', () => {
      const weeksWithDuplicatedName = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' },
                { role: 'E', roleId: 'electric_factura', personId: 'person_pol_alt', name: 'Pol Peitx' },
              ],
            },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithDuplicatedName,
        () => true,
        { role: 'E', roleId: 'electric_factura', personId: 'person_pol_alt', name: 'Pol Peitx' },
        'semanal'
      );

      expect(result.workedDays).toBe(1);
    });

    it('handles prelight team (suffix P)', () => {
      const weeksWithPrelight = [
        {
          days: [
            { tipo: 'Rodaje', prelight: [{ role: 'GP', name: 'Juan' }] },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithPrelight,
        () => true,
        { role: 'GP', name: 'Juan' },
        'semanal'
      );

      expect(result.workedDays).toBe(1);
      expect(result.workedPre).toBe(1);
    });

    it('handles pickup team (suffix R)', () => {
      const weeksWithPickup = [
        {
          days: [
            { tipo: 'Rodaje', pickup: [{ role: 'GR', name: 'Juan' }] },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithPickup,
        () => true,
        { role: 'GR', name: 'Juan' },
        'semanal'
      );

      expect(result.workedDays).toBe(1);
      expect(result.workedPick).toBe(1);
    });

    it('prioritizes prelight over base when the same base role is present in both lists', () => {
      const weeksWithBaseAndPrelight = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [{ role: 'E', name: 'Ricard Durany' }],
              prelight: [{ role: 'EP', name: 'Ricard Durany' }],
              prelightTipo: 'Prelight',
            },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithBaseAndPrelight,
        () => true,
        { role: 'E', name: 'Ricard Durany' },
        'diario'
      );

      expect(result.workedPre).toBe(1);
      expect(result.workedBase).toBe(0);
      expect(result.prelight).toBe(1);
    });

    it('uses extra block jornada type for extra crew rows', () => {
      const weeksWithExtraBlocks = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', name: 'Ricard Durany', source: 'ref' },
                { role: 'E', name: 'Oriol Monguilod', source: 'ref' },
              ],
              refBlocks: [
                {
                  id: 'extra_1',
                  tipo: 'Rodaje',
                  start: '07:00',
                  end: '18:00',
                  list: [{ role: 'E', name: 'Ricard Durany', source: 'ref' }],
                  text: '',
                },
                {
                  id: 'extra_2',
                  tipo: '1/2 jornada',
                  start: '08:00',
                  end: '14:00',
                  list: [{ role: 'E', name: 'Oriol Monguilod', source: 'ref' }],
                  text: '',
                },
              ],
            },
          ],
        },
      ];

      const ricard = calcWorkedBreakdown(
        weeksWithExtraBlocks,
        () => true,
        { role: 'E', name: 'Ricard Durany', source: 'ref' },
        'diario'
      );
      const oriol = calcWorkedBreakdown(
        weeksWithExtraBlocks,
        () => true,
        { role: 'E', name: 'Oriol Monguilod', source: 'ref' },
        'diario'
      );

      expect(ricard.rodaje).toBe(1);
      expect(ricard.halfDays).toBe(0);
      expect(oriol.rodaje).toBe(0);
      expect(oriol.halfDays).toBe(1);
    });

    it('still uses extra block jornada type when the row source is missing', () => {
      const weeksWithExtraBlocks = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [{ role: 'E', name: 'Oriol Monguilod', source: 'ref' }],
              refBlocks: [
                {
                  id: 'extra_half',
                  tipo: '1/2 jornada',
                  start: '08:00',
                  end: '14:00',
                  list: [{ role: 'E', name: 'Oriol Monguilod', source: 'ref' }],
                  text: '',
                },
              ],
            },
          ],
        },
      ];

      const oriol = calcWorkedBreakdown(
        weeksWithExtraBlocks,
        () => true,
        { role: 'E', name: 'Oriol Monguilod' },
        'diario'
      );

      expect(oriol.rodaje).toBe(0);
      expect(oriol.halfDays).toBe(1);
    });

    it('keeps base rows from double-counting pickup days when a pickup row also exists', () => {
      const weeksWithBaseAndPickup = [
        {
          days: [
            {
              tipo: 'Rodaje',
              pickup: [{ role: 'ER', name: 'Pol Peitx', source: 'base' }],
              pickupTipo: 'Recogida',
            },
            {
              tipo: 'Rodaje',
              team: [{ role: 'E', name: 'Pol Peitx', source: 'base' }],
            },
          ],
        },
      ];

      const baseRow = calcWorkedBreakdown(
        weeksWithBaseAndPickup,
        () => true,
        { role: 'E', name: 'Pol Peitx', source: 'base-strict' as any },
        'diario'
      );
      const pickupRow = calcWorkedBreakdown(
        weeksWithBaseAndPickup,
        () => true,
        { role: 'ER', name: 'Pol Peitx', source: 'base' },
        'diario'
      );

      expect(baseRow.rodaje).toBe(1);
      expect(baseRow.recogida).toBe(0);
      expect(pickupRow.rodaje).toBe(0);
      expect(pickupRow.recogida).toBe(1);
      expect((baseRow.rodaje || 0) + (pickupRow.recogida || 0)).toBe(2);
    });

    it('keeps base rows from double-counting extra blocks when an extra row also exists', () => {
      const weeksWithBaseAndExtra = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', name: 'Ricard Durany', source: 'ref' },
                { role: 'E', name: 'Jordi', source: 'base' },
              ],
              refBlocks: [
                {
                  id: 'extra_1',
                  tipo: 'Rodaje',
                  start: '07:00',
                  end: '18:00',
                  list: [{ role: 'E', name: 'Ricard Durany', source: 'ref' }],
                  text: '',
                },
              ],
            },
          ],
        },
      ];

      const baseRow = calcWorkedBreakdown(
        weeksWithBaseAndExtra,
        () => true,
        { role: 'E', name: 'Ricard Durany', source: 'base-strict' as any },
        'diario'
      );
      const extraRow = calcWorkedBreakdown(
        weeksWithBaseAndExtra,
        () => true,
        { role: 'E', name: 'Ricard Durany', source: 'ref' },
        'diario'
      );

      expect(baseRow.rodaje).toBe(0);
      expect(extraRow.rodaje).toBe(1);
    });

    it('matches by roleId before falling back to legacy role matching', () => {
      const weeksWithCustomRoles = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', roleId: 'electric_day', name: 'Juan' },
                { role: 'E', roleId: 'electric_night', name: 'Juan' },
              ],
            },
          ],
        },
      ];

      const result = calcWorkedBreakdown(
        weeksWithCustomRoles,
        () => true,
        { role: 'E', roleId: 'electric_night', name: 'Juan' },
        'semanal'
      );

      expect(result.workedDays).toBe(1);
    });

    it('does not let the same personId make two different roleIds count each other days', () => {
      const weeksWithSamePersonTwoTariffs = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' },
              ],
            },
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' },
              ],
            },
          ],
        },
      ];

      const baseRow = calcWorkedBreakdown(
        weeksWithSamePersonTwoTariffs,
        () => true,
        { role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' },
        'semanal'
      );
      const customRow = calcWorkedBreakdown(
        weeksWithSamePersonTwoTariffs,
        () => true,
        { role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' },
        'semanal'
      );

      expect(baseRow.workedDays).toBe(1);
      expect(customRow.workedDays).toBe(1);
    });

    it('does not let an ambiguous slot without roleId count for the custom tariff when the same person has multiple tariffs', () => {
      const weeksWithAmbiguousBaseSlot = [
        {
          days: [
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', personId: 'person_pol', name: 'Pol Peitx' },
              ],
            },
            {
              tipo: 'Rodaje',
              team: [
                { role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' },
              ],
            },
          ],
        },
      ];

      const customRow = calcWorkedBreakdown(
        weeksWithAmbiguousBaseSlot,
        () => true,
        { role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' },
        'semanal'
      );

      expect(customRow.workedDays).toBe(1);
    });
  });
});
