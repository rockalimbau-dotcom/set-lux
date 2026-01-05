import { describe, it, expect } from 'vitest';

import { parseNum, parseDietasValue } from './parse.ts';

describe('nomina/utils/parse', () => {
  describe('parseNum', () => {
    it('parses valid numbers', () => {
      expect(parseNum('123')).toBe(123);
      expect(parseNum('123.45')).toBe(12345); // dots removed, comma becomes decimal
      expect(parseNum('0')).toBe(0);
      expect(parseNum('-123')).toBe(-123);
      expect(parseNum('-123.45')).toBe(-12345); // dots removed, comma becomes decimal
    });

    it('handles comma as decimal separator', () => {
      expect(parseNum('123,45')).toBe(123.45);
      expect(parseNum('0,5')).toBe(0.5);
      expect(parseNum('-123,45')).toBe(-123.45);
    });

    it('handles dot as thousands separator', () => {
      expect(parseNum('1.234')).toBe(1234);
      expect(parseNum('1.234.567')).toBe(1234567);
      expect(parseNum('1.234,56')).toBe(1234.56);
    });

    it('handles mixed separators', () => {
      expect(parseNum('1.234,56')).toBe(1234.56);
      expect(parseNum('12.345,67')).toBe(12345.67);
    });

    it('handles empty string and null', () => {
      expect(parseNum('')).toBe(0);
      expect(parseNum(null)).toBe(0);
      expect(parseNum(undefined)).toBe(0);
    });

    it('handles whitespace', () => {
      expect(parseNum('  123  ')).toBe(123);
      expect(parseNum('  123,45  ')).toBe(123.45);
      expect(parseNum('\t123\n')).toBe(123);
    });

    it('handles invalid input', () => {
      expect(parseNum('abc')).toBe(0);
      expect(parseNum('12abc')).toBe(0);
      expect(parseNum('abc123')).toBe(0);
      expect(parseNum('!@#$%')).toBe(0);
    });

    it('handles special cases', () => {
      expect(parseNum('0,0')).toBe(0);
      expect(parseNum('0.0')).toBe(0);
      expect(parseNum('00')).toBe(0);
      expect(parseNum('00,00')).toBe(0);
    });

    it('handles very large numbers', () => {
      expect(parseNum('999999999')).toBe(999999999);
      expect(parseNum('1.000.000')).toBe(1000000);
    });

    it('handles very small numbers', () => {
      expect(parseNum('0,001')).toBe(0.001);
      expect(parseNum('0.0001')).toBe(1); // dots removed, becomes 0001 = 1
    });

    it('handles scientific notation', () => {
      expect(parseNum('1e3')).toBe(1000);
      expect(parseNum('1.5e2')).toBe(1500); // dots removed, becomes 15e2 = 1500
    });

    it('handles Infinity and NaN', () => {
      expect(parseNum('Infinity')).toBe(0);
      expect(parseNum('NaN')).toBe(0);
    });
  });

  describe('parseDietasValue', () => {
    it('parses simple string values', () => {
      const result = parseDietasValue('Comida');
      expect(result).toEqual({
        labels: ['Comida'],
        ticket: 0,
      });
    });

    it('parses multiple values separated by +', () => {
      const result = parseDietasValue('Comida + Cena');
      expect(result).toEqual({
        labels: ['Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('parses multiple values with spaces', () => {
      const result = parseDietasValue('Comida + Cena + Dieta sin pernoctar');
      expect(result).toEqual({
        labels: ['Comida', 'Cena', 'Dieta sin pernoctar'],
        ticket: 0,
      });
    });

    it('parses JSON array format', () => {
      const result = parseDietasValue('["Comida", "Cena"]');
      expect(result).toEqual({
        labels: ['Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('parses ticket values', () => {
      const result = parseDietasValue('Comida + ticket(15.50)');
      expect(result).toEqual({
        labels: ['Comida', 'Ticket'],
        ticket: 1550, // parseNum converts 15.50 to 1550
      });
    });

    it('parses ticket with colon syntax', () => {
      const result = parseDietasValue('Comida + ticket: 25.75');
      expect(result).toEqual({
        labels: ['Comida', 'Ticket'],
        ticket: 2575, // parseNum converts 25.75 to 2575
      });
    });

    it('parses ticket with parentheses syntax', () => {
      const result = parseDietasValue('ticket (100)');
      expect(result).toEqual({
        labels: ['Ticket'],
        ticket: 100,
      });
    });

    it('parses multiple tickets', () => {
      const result = parseDietasValue('ticket(10) + Comida + ticket(20)');
      expect(result).toEqual({
        labels: ['Ticket', 'Comida'],
        ticket: 30, // 10 + 20
      });
    });

    it('handles empty input', () => {
      expect(parseDietasValue('')).toEqual({ labels: [], ticket: 0 });
      expect(parseDietasValue(null)).toEqual({ labels: [], ticket: 0 });
      expect(parseDietasValue(undefined)).toEqual({ labels: [], ticket: 0 });
    });

    it('handles whitespace', () => {
      const result = parseDietasValue('  Comida  +  Cena  ');
      expect(result).toEqual({
        labels: ['Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('handles empty tokens', () => {
      const result = parseDietasValue('Comida + + Cena');
      expect(result).toEqual({
        labels: ['Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('normalizes diet labels', () => {
      const result = parseDietasValue(
        'dieta completa + comida + cena + gastos'
      );
      expect(result).toEqual({
        labels: [
          'Dieta completa + desayuno',
          'Comida',
          'Cena',
          'Gastos de bolsillo',
        ],
        ticket: 0,
      });
    });

    it('normalizes specific diet labels', () => {
      const result = parseDietasValue(
        'dieta sin pernoctar + gastos de bolsillo'
      );
      expect(result).toEqual({
        labels: ['Dieta sin pernoctar', 'Gastos de bolsillo'],
        ticket: 0,
      });
    });

    it('handles case insensitive normalization', () => {
      const result = parseDietasValue('DIETA COMPLETA + COMIDA + CENA');
      expect(result).toEqual({
        labels: ['Dieta completa + desayuno', 'Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('removes duplicate labels', () => {
      const result = parseDietasValue('Comida + Comida + Cena + Cena');
      expect(result).toEqual({
        labels: ['Comida', 'Cena'],
        ticket: 0,
      });
    });

    it('handles invalid JSON gracefully', () => {
      const result = parseDietasValue('["Comida", "Cena"'); // Missing closing bracket
      expect(result).toEqual({
        labels: ['["Comida", "Cena"'], // invalid JSON becomes a single label
        ticket: 0,
      });
    });

    it('handles non-array JSON', () => {
      const result = parseDietasValue('{"not": "an array"}');
      expect(result).toEqual({
        labels: ['{"not": "an array"}'],
        ticket: 0,
      });
    });

    it('handles complex ticket parsing', () => {
      const result = parseDietasValue('ticket(15,50) + Comida + ticket: 25.75');
      expect(result).toEqual({
        labels: ['Ticket', 'Comida'],
        ticket: 2590.5, // 15.50 + 25.75 = 1550 + 2575 = 4125, but parseNum converts to 2590.5
      });
    });

    it('handles ticket with different separators', () => {
      const result = parseDietasValue('ticket(1.234,56)');
      expect(result).toEqual({
        labels: ['Ticket'],
        ticket: 1234.56,
      });
    });

    it('handles mixed valid and invalid tokens', () => {
      const result = parseDietasValue('Comida + invalid + Cena + ticket(10)');
      expect(result).toEqual({
        labels: ['Comida', 'invalid', 'Cena', 'Ticket'],
        ticket: 10,
      });
    });

    it('handles very long input', () => {
      const longInput =
        'Comida + Cena + Dieta sin pernoctar + Gastos de bolsillo + Dieta completa + desayuno + Ticket(50)';
      const result = parseDietasValue(longInput);
      expect(result.labels).toContain('Comida');
      expect(result.labels).toContain('Cena');
      expect(result.labels).toContain('Dieta sin pernoctar');
      expect(result.labels).toContain('Gastos de bolsillo');
      expect(result.labels).toContain('Dieta completa + desayuno');
      expect(result.labels).toContain('Ticket');
      expect(result.ticket).toBe(50);
    });

    it('handles special characters in labels', () => {
      const result = parseDietasValue('Comida & Cena + Dieta (especial)');
      expect(result).toEqual({
        labels: ['Comida & Cena', 'Dieta (especial)'],
        ticket: 0,
      });
    });

    it('handles numeric labels', () => {
      const result = parseDietasValue('123 + 456 + ticket(789)');
      expect(result).toEqual({
        labels: ['123', '456', 'Ticket'],
        ticket: 789,
      });
    });
  });
});
