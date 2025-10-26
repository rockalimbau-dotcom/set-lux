import { describe, it, expect } from 'vitest';
import { 
  parseYYYYMMDD, 
  toISO, 
  addDays, 
  monthKeyFromISO, 
  monthLabelEs 
} from './date';

describe('date.ts', () => {
  describe('parseYYYYMMDD', () => {
    it('should parse valid date strings', () => {
      const date = parseYYYYMMDD('2025-10-13');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(date.getDate()).toBe(13);
    });

    it('should handle different dates', () => {
      const date = parseYYYYMMDD('2024-01-01');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });
  });

  describe('toISO', () => {
    it('should format dates to YYYY-MM-DD', () => {
      const date = new Date(2025, 9, 13); // October 13, 2025
      expect(toISO(date)).toBe('2025-10-13');
    });

    it('should pad months and days with zeros', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(toISO(date)).toBe('2025-01-05');
    });
  });

  describe('addDays', () => {
    it('should add days to a date', () => {
      const date = new Date(2025, 9, 13);
      const nextDate = addDays(date, 1);
      expect(nextDate.getDate()).toBe(14);
    });

    it('should handle month boundaries', () => {
      const date = new Date(2025, 9, 31); // October 31
      const nextDate = addDays(date, 1);
      expect(nextDate.getMonth()).toBe(10); // November
      expect(nextDate.getDate()).toBe(1);
    });

    it('should handle year boundaries', () => {
      const date = new Date(2025, 11, 31); // December 31
      const nextDate = addDays(date, 1);
      expect(nextDate.getFullYear()).toBe(2026);
      expect(nextDate.getMonth()).toBe(0);
      expect(nextDate.getDate()).toBe(1);
    });

    it('should subtract days when negative', () => {
      const date = new Date(2025, 9, 13);
      const prevDate = addDays(date, -1);
      expect(prevDate.getDate()).toBe(12);
    });
  });

  describe('monthKeyFromISO', () => {
    it('should extract month key from ISO date', () => {
      expect(monthKeyFromISO('2025-10-13')).toBe('2025-10');
      expect(monthKeyFromISO('2024-01-01')).toBe('2024-01');
      expect(monthKeyFromISO('2023-12-31')).toBe('2023-12');
    });

    it('should pad months with zeros', () => {
      expect(monthKeyFromISO('2025-3-5')).toBe('2025-03');
    });
  });

  describe('monthLabelEs', () => {
    it('should return month names in Spanish', () => {
      expect(monthLabelEs('2025-01')).toBe('Enero');
      expect(monthLabelEs('2025-06')).toBe('Junio');
      expect(monthLabelEs('2025-12')).toBe('Diciembre');
    });

    it('should include year when withYear is true', () => {
      expect(monthLabelEs('2025-01', true)).toBe('Enero 2025');
      expect(monthLabelEs('2023-06', true)).toBe('Junio 2023');
    });

    it('should handle invalid month keys', () => {
      expect(monthLabelEs('2025-13')).toBe(''); // Month 13 is out of range (MESES_ES[12] = undefined)
      expect(monthLabelEs('2025-0')).toBe('Enero'); // Month 0 uses m || 1 -> 1 -> Enero
    });
  });
});

