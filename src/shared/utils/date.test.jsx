import { describe, it, expect } from 'vitest';

import {
  pad2,
  toYYYYMMDD,
  parseYYYYMMDD,
  addDays,
  formatDDMMYYYY,
} from './date.ts';

describe('date utils', () => {
  describe('pad2', () => {
    it('pads single digit numbers', () => {
      expect(pad2(1)).toBe('01');
      expect(pad2(5)).toBe('05');
      expect(pad2(9)).toBe('09');
    });

    it('pads double digit numbers', () => {
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
  });

  describe('toYYYYMMDD', () => {
    it('formats date correctly', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      expect(toYYYYMMDD(date)).toBe('2023-12-25');
    });

    it('formats date with single digit month and day', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      expect(toYYYYMMDD(date)).toBe('2023-01-05');
    });

    it('formats date with zero month and day', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      expect(toYYYYMMDD(date)).toBe('2023-01-01');
    });
  });

  describe('parseYYYYMMDD', () => {
    it('parses valid date string', () => {
      const result = parseYYYYMMDD('2023-12-25');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December is 11
      expect(result.getDate()).toBe(25);
    });

    it('parses date with single digit month and day', () => {
      const result = parseYYYYMMDD('2023-01-05');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(5);
    });

    it('handles missing month and day', () => {
      const result = parseYYYYMMDD('2023');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(0); // Defaults to January
      expect(result.getDate()).toBe(1); // Defaults to 1st
    });

    it('handles missing day only', () => {
      const result = parseYYYYMMDD('2023-12');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December is 11
      expect(result.getDate()).toBe(1); // Defaults to 1st
    });

    it('handles number input', () => {
      const result = parseYYYYMMDD('2023-12-25');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(25);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date(2023, 11, 25);
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(30);
    });

    it('adds negative days', () => {
      const date = new Date(2023, 11, 25);
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(20);
    });

    it('handles month overflow', () => {
      const date = new Date(2023, 11, 25); // December 25
      const result = addDays(date, 10);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(4);
      expect(result.getFullYear()).toBe(2024);
    });

    it('handles month underflow', () => {
      const date = new Date(2023, 0, 5); // January 5
      const result = addDays(date, -10);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(26);
      expect(result.getFullYear()).toBe(2022);
    });

    it('does not mutate original date', () => {
      const date = new Date(2023, 11, 25);
      const originalTime = date.getTime();
      addDays(date, 5);
      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe('formatDDMMYYYY', () => {
    it('formats date correctly', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      expect(formatDDMMYYYY(date)).toBe('25/12/2023');
    });

    it('formats date with single digit month and day', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      expect(formatDDMMYYYY(date)).toBe('05/01/2023');
    });

    it('formats date with zero month and day', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      expect(formatDDMMYYYY(date)).toBe('01/01/2023');
    });
  });

  describe('integration tests', () => {
    it('round trip conversion works', () => {
      const originalDate = new Date(2023, 11, 25);
      const formatted = toYYYYMMDD(originalDate);
      const parsed = parseYYYYMMDD(formatted);

      expect(parsed.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsed.getMonth()).toBe(originalDate.getMonth());
      expect(parsed.getDate()).toBe(originalDate.getDate());
    });

    it('addDays and formatDDMMYYYY work together', () => {
      const date = new Date(2023, 11, 25);
      const newDate = addDays(date, 7);
      const formatted = formatDDMMYYYY(newDate);

      expect(formatted).toBe('01/01/2024');
    });

    it('all functions work with edge cases', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      const added = addDays(date, 1);
      const formatted = toYYYYMMDD(added);
      const parsed = parseYYYYMMDD(formatted);
      const finalFormatted = formatDDMMYYYY(parsed);

      expect(finalFormatted).toBe('01/01/2024');
    });
  });
});
