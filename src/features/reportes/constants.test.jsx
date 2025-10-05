import { describe, it, expect } from 'vitest';

import { DAY_NAMES, CONCEPTS, DIETAS_OPCIONES, SI_NO } from './constants.ts';

describe('reportes/constants', () => {
  describe('DAY_NAMES', () => {
    it('contains all 7 days of the week', () => {
      expect(DAY_NAMES).toHaveLength(7);
    });

    it('has correct day names', () => {
      expect(DAY_NAMES).toEqual([
        'Lun',
        'Mar',
        'Mié',
        'Jue',
        'Vie',
        'Sáb',
        'Dom',
      ]);
    });

    it('is readonly', () => {
      expect(DAY_NAMES).toBeDefined();
      expect(Array.isArray(DAY_NAMES)).toBe(true);
    });
  });

  describe('CONCEPTS', () => {
    it('contains all expected concepts', () => {
      expect(CONCEPTS).toHaveLength(7);
    });

    it('has correct concept names', () => {
      expect(CONCEPTS).toEqual([
        'Horas extra',
        'Turn Around',
        'Nocturnidad',
        'Penalty lunch',
        'Dietas',
        'Kilometraje',
        'Transporte',
      ]);
    });

    it('is readonly', () => {
      expect(CONCEPTS).toBeDefined();
      expect(Array.isArray(CONCEPTS)).toBe(true);
    });
  });

  describe('DIETAS_OPCIONES', () => {
    it('contains all expected diet options', () => {
      expect(DIETAS_OPCIONES).toHaveLength(7);
    });

    it('has correct diet option names', () => {
      expect(DIETAS_OPCIONES).toEqual([
        '',
        'Comida',
        'Cena',
        'Dieta sin pernoctar',
        'Dieta completa + desayuno',
        'Gastos de bolsillo',
        'Ticket',
      ]);
    });

    it('is readonly', () => {
      expect(DIETAS_OPCIONES).toBeDefined();
      expect(Array.isArray(DIETAS_OPCIONES)).toBe(true);
    });
  });

  describe('SI_NO', () => {
    it('contains yes/no options', () => {
      expect(SI_NO).toHaveLength(2);
    });

    it('has correct yes/no values', () => {
      expect(SI_NO).toEqual(['', 'SI']);
    });

    it('is readonly', () => {
      expect(SI_NO).toBeDefined();
      expect(Array.isArray(SI_NO)).toBe(true);
    });
  });
});
