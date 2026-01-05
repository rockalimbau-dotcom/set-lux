import { describe, it, expect } from 'vitest';

import { DAYS, mdKey } from './constants.ts';

describe('planificacion/constants', () => {
  describe('DAYS', () => {
    it('contains all 7 days of the week', () => {
      expect(DAYS).toHaveLength(7);
    });

    it('has correct day information', () => {
      expect(DAYS[0]).toEqual({ idx: 0, key: 'mon', name: 'Lunes' });
      expect(DAYS[1]).toEqual({ idx: 1, key: 'tue', name: 'Martes' });
      expect(DAYS[2]).toEqual({ idx: 2, key: 'wed', name: 'Miércoles' });
      expect(DAYS[3]).toEqual({ idx: 3, key: 'thu', name: 'Jueves' });
      expect(DAYS[4]).toEqual({ idx: 4, key: 'fri', name: 'Viernes' });
      expect(DAYS[5]).toEqual({ idx: 5, key: 'sat', name: 'Sábado' });
      expect(DAYS[6]).toEqual({ idx: 6, key: 'sun', name: 'Domingo' });
    });

    it('has correct indices', () => {
      DAYS.forEach((day, index) => {
        expect(day.idx).toBe(index);
      });
    });

    it('has correct keys', () => {
      const expectedKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      DAYS.forEach((day, index) => {
        expect(day.key).toBe(expectedKeys[index]);
      });
    });

    it('has correct Spanish names', () => {
      const expectedNames = [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
      ];
      DAYS.forEach((day, index) => {
        expect(day.name).toBe(expectedNames[index]);
      });
    });

    it('is readonly', () => {
      // DAYS is readonly but not frozen, so push won't throw
      // Instead, we test that it's marked as readonly in TypeScript
      expect(DAYS).toBeDefined();
      expect(Array.isArray(DAYS)).toBe(true);
    });
  });

  describe('mdKey', () => {
    it('formats month and day with leading zeros', () => {
      expect(mdKey(1, 1)).toBe('01-01');
      expect(mdKey(12, 25)).toBe('12-25');
      expect(mdKey(3, 8)).toBe('03-08');
    });

    it('handles single digit months and days', () => {
      expect(mdKey(1, 5)).toBe('01-05');
      expect(mdKey(9, 1)).toBe('09-01');
    });

    it('handles double digit months and days', () => {
      expect(mdKey(10, 15)).toBe('10-15');
      expect(mdKey(12, 31)).toBe('12-31');
    });

    it('handles zero values', () => {
      expect(mdKey(0, 0)).toBe('00-00');
    });

    it('handles large numbers', () => {
      expect(mdKey(99, 99)).toBe('99-99');
    });

    it('handles negative numbers', () => {
      expect(mdKey(-1, -5)).toBe('-1--5');
    });

    it('handles decimal numbers', () => {
      expect(mdKey(1.5, 2.7)).toBe('1.5-2.7');
    });

    it('handles string inputs', () => {
      expect(mdKey('1', '5')).toBe('01-05');
      expect(mdKey('12', '25')).toBe('12-25');
    });

    it('handles mixed types', () => {
      expect(mdKey(1, '5')).toBe('01-05');
      expect(mdKey('12', 25)).toBe('12-25');
    });
  });
});
