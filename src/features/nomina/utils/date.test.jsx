import { describe, it, expect } from 'vitest';
import {
  pad2,
  toISO,
  parseYYYYMMDD,
  addDays,
  monthKeyFromISO,
  monthLabelEs,
} from './date.ts';

describe('nomina/utils/date', () => {
  describe('pad2', () => {
    it('pads single digit numbers with leading zero', () => {
      expect(pad2(1)).toBe('01');
      expect(pad2(5)).toBe('05');
      expect(pad2(9)).toBe('09');
    });

    it('keeps double digit numbers unchanged', () => {
      expect(pad2(10)).toBe('10');
      expect(pad2(25)).toBe('25');
      expect(pad2(99)).toBe('99');
    });

    it('handles zero', () => {
      expect(pad2(0)).toBe('00');
    });

    it('handles negative numbers', () => {
      expect(pad2(-1)).toBe('-1');
      expect(pad2(-10)).toBe('-10');
    });

    it('handles large numbers', () => {
      expect(pad2(100)).toBe('100');
      expect(pad2(999)).toBe('999');
    });
  });

  describe('toISO', () => {
    it('converts date to ISO string format', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      expect(toISO(date)).toBe('2023-01-15');
    });

    it('handles single digit months and days', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      expect(toISO(date)).toBe('2023-01-05');
    });

    it('handles December', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      expect(toISO(date)).toBe('2023-12-31');
    });

    it('handles leap year', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      expect(toISO(date)).toBe('2024-02-29');
    });

    it('handles year boundaries', () => {
      const date = new Date(2022, 11, 31); // December 31, 2022
      expect(toISO(date)).toBe('2022-12-31');
    });
  });

  describe('parseYYYYMMDD', () => {
    it('parses valid date strings', () => {
      const result = parseYYYYMMDD('2023-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('handles single digit months and days', () => {
      const result = parseYYYYMMDD('2023-1-5');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(5);
    });

    it('handles December', () => {
      const result = parseYYYYMMDD('2023-12-31');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });

    it('handles leap year', () => {
      const result = parseYYYYMMDD('2024-02-29');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(29);
    });

    it('handles invalid dates gracefully', () => {
      const result = parseYYYYMMDD('2023-13-01');
      expect(result).toBeInstanceOf(Date);
      // JavaScript Date constructor handles invalid dates by wrapping around
    });

    it('handles empty string', () => {
      const result = parseYYYYMMDD('');
      expect(result).toBeInstanceOf(Date);
    });

    it('handles malformed strings', () => {
      const result = parseYYYYMMDD('invalid-date');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('adds negative days (subtracts)', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('handles month boundaries', () => {
      const date = new Date(2023, 0, 31); // January 31, 2023
      const result = addDays(date, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(1);
    });

    it('handles year boundaries', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      const result = addDays(date, 1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    it('handles zero days', () => {
      const date = new Date(2023, 0, 15);
      const result = addDays(date, 0);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('does not mutate original date', () => {
      const date = new Date(2023, 0, 15);
      const originalTime = date.getTime();
      addDays(date, 5);
      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe('monthKeyFromISO', () => {
    it('extracts month key from ISO date string', () => {
      expect(monthKeyFromISO('2023-01-15')).toBe('2023-01');
      expect(monthKeyFromISO('2023-12-31')).toBe('2023-12');
    });

    it('handles single digit months', () => {
      expect(monthKeyFromISO('2023-1-15')).toBe('2023-01');
      expect(monthKeyFromISO('2023-9-15')).toBe('2023-09');
    });

    it('handles edge cases', () => {
      expect(monthKeyFromISO('2023-01-01')).toBe('2023-01');
      expect(monthKeyFromISO('2023-12-31')).toBe('2023-12');
    });

    it('handles invalid input gracefully', () => {
      expect(monthKeyFromISO('invalid')).toBe('NaN-undefined');
      expect(monthKeyFromISO('')).toBe('0-undefined');
    });
  });

  describe('monthLabelEs', () => {
    it('returns month name in Spanish', () => {
      expect(monthLabelEs('2023-01')).toBe('Enero');
      expect(monthLabelEs('2023-02')).toBe('Febrero');
      expect(monthLabelEs('2023-03')).toBe('Marzo');
      expect(monthLabelEs('2023-04')).toBe('Abril');
      expect(monthLabelEs('2023-05')).toBe('Mayo');
      expect(monthLabelEs('2023-06')).toBe('Junio');
      expect(monthLabelEs('2023-07')).toBe('Julio');
      expect(monthLabelEs('2023-08')).toBe('Agosto');
      expect(monthLabelEs('2023-09')).toBe('Septiembre');
      expect(monthLabelEs('2023-10')).toBe('Octubre');
      expect(monthLabelEs('2023-11')).toBe('Noviembre');
      expect(monthLabelEs('2023-12')).toBe('Diciembre');
    });

    it('includes year when withYear is true', () => {
      expect(monthLabelEs('2023-01', true)).toBe('Enero 2023');
      expect(monthLabelEs('2023-12', true)).toBe('Diciembre 2023');
    });

    it('excludes year when withYear is false', () => {
      expect(monthLabelEs('2023-01', false)).toBe('Enero');
      expect(monthLabelEs('2023-12', false)).toBe('Diciembre');
    });

    it('excludes year by default', () => {
      expect(monthLabelEs('2023-01')).toBe('Enero');
      expect(monthLabelEs('2023-12')).toBe('Diciembre');
    });

    it('handles invalid month numbers', () => {
      expect(monthLabelEs('2023-00')).toBe('Enero'); // 0 becomes 1, so Enero
      expect(monthLabelEs('2023-13')).toBe(''); // 13 is out of range, so empty
      expect(monthLabelEs('2023-99')).toBe(''); // 99 is out of range, so empty
    });

    it('handles malformed input', () => {
      expect(monthLabelEs('invalid')).toBe('Enero'); // invalid becomes 1, so Enero
      expect(monthLabelEs('')).toBe('Enero'); // empty becomes 1, so Enero
    });

    it('handles edge cases', () => {
      expect(monthLabelEs('2023-1')).toBe('Enero');
      expect(monthLabelEs('2023-01-15')).toBe('Enero');
    });
  });

  describe('integration tests', () => {
    it('round trip conversion works correctly', () => {
      const originalDate = new Date(2023, 5, 15); // June 15, 2023
      const isoString = toISO(originalDate);
      const parsedDate = parseYYYYMMDD(isoString);
      
      expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
      expect(parsedDate.getDate()).toBe(originalDate.getDate());
    });

    it('month key and label work together', () => {
      const date = new Date(2023, 2, 15); // March 15, 2023
      const isoString = toISO(date);
      const monthKey = monthKeyFromISO(isoString);
      const monthLabel = monthLabelEs(monthKey);
      
      expect(monthKey).toBe('2023-03');
      expect(monthLabel).toBe('Marzo');
    });

    it('addDays and toISO work together', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const newDate = addDays(date, 30);
      const isoString = toISO(newDate);
      
      expect(isoString).toBe('2023-02-14');
    });
  });
});
