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
  });
});

