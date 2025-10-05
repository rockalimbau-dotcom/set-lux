import { describe, it, expect } from 'vitest';

import { parseNum, parseHHMM, diffMinutes, ceilHours } from './numbers.ts';

describe('numbers utils', () => {
  describe('parseNum', () => {
    it('should parse valid numbers', () => {
      expect(parseNum('123')).toBe(123);
      expect(parseNum('123.45')).toBe(12345); // parseNum removes all dots first
      expect(parseNum('123,45')).toBe(123.45);
      expect(parseNum('1,234.56')).toBe(1.23456); // parseNum removes all dots first, then replaces comma
    });

    it('should handle empty string', () => {
      expect(parseNum('')).toBeNaN();
    });

    it('should handle invalid strings', () => {
      expect(parseNum('abc')).toBeNaN();
      expect(parseNum('12abc')).toBeNaN();
    });

    it('should handle zero', () => {
      expect(parseNum('0')).toBe(0);
      expect(parseNum('0,0')).toBe(0);
    });
  });

  describe('parseHHMM', () => {
    it('should parse valid time strings', () => {
      expect(parseHHMM('09:30')).toBe(570); // 9*60 + 30 = 570 minutes
      expect(parseHHMM('00:00')).toBe(0);
      expect(parseHHMM('23:59')).toBe(1439); // 23*60 + 59 = 1439 minutes
    });

    it('should handle invalid time strings', () => {
      expect(parseHHMM('')).toBeNull();
      expect(parseHHMM('abc')).toBeNull();
      expect(parseHHMM('25:00')).toBeNull(); // Invalid hour
      expect(parseHHMM('12:60')).toBeNull(); // Invalid minute
    });

    it('should handle single digit hours and minutes', () => {
      expect(parseHHMM('9:5')).toBeNull(); // Single digit format not supported
    });
  });

  describe('diffMinutes', () => {
    it('should calculate time difference in minutes', () => {
      expect(diffMinutes('09:00', '17:00')).toBe(480); // 8 hours = 480 minutes
      expect(diffMinutes('10:30', '14:15')).toBe(225); // 3h 45m = 225 minutes
    });

    it('should handle same time', () => {
      expect(diffMinutes('12:00', '12:00')).toBe(0);
    });

    it('should handle invalid times', () => {
      expect(diffMinutes('invalid', '17:00')).toBeNull();
      expect(diffMinutes('09:00', 'invalid')).toBeNull();
    });
  });

  describe('ceilHours', () => {
    it('should round up minutes to hours', () => {
      expect(ceilHours(60)).toBe(1); // 60 minutes = 1 hour
      expect(ceilHours(90)).toBe(2); // 90 minutes = 1.5 hours, rounded up to 2
      expect(ceilHours(30)).toBe(1); // 30 minutes = 0.5 hours, rounded up to 1
    });

    it('should handle zero', () => {
      expect(ceilHours(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(ceilHours(-30)).toBe(-0); // Math.ceil(-0.5) = -0
      expect(ceilHours(-60)).toBe(-1); // Math.ceil(-1) = -1
    });
  });
});
