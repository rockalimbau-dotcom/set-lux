import { describe, it, expect } from 'vitest';

import { norm, parseDietas, formatDietas } from './text.ts';

describe('text utils', () => {
  describe('norm', () => {
    it('should normalize and lowercase strings', () => {
      expect(norm('HOLA')).toBe('hola');
      expect(norm('  Mundo  ')).toBe('mundo');
      expect(norm('Test String')).toBe('test string');
    });

    it('should remove diacritics', () => {
      expect(norm('José')).toBe('jose');
      expect(norm('María')).toBe('maria');
      expect(norm('Niño')).toBe('nino');
      expect(norm('Señor')).toBe('senor');
      expect(norm('François')).toBe('francois');
    });

    it('should handle empty and null values', () => {
      expect(norm('')).toBe('');
      expect(norm(null)).toBe('');
      expect(norm(undefined)).toBe('');
    });

    it('should handle numbers', () => {
      expect(norm(123)).toBe('123');
      expect(norm(0)).toBe('0');
    });

    it('should handle special characters', () => {
      expect(norm('Test-String')).toBe('test-string');
      expect(norm('Test_String')).toBe('test_string');
      expect(norm('Test.String')).toBe('test.string');
    });

    it('should handle mixed case with diacritics', () => {
      expect(norm('José María')).toBe('jose maria');
      expect(norm('Ángel Niño')).toBe('angel nino');
    });
  });

  describe('parseDietas', () => {
    it('should return empty result for null/undefined', () => {
      const result1 = parseDietas(null);
      const result2 = parseDietas(undefined);
      const result3 = parseDietas('');

      expect(result1).toEqual({ items: new Set(), ticket: null });
      expect(result2).toEqual({ items: new Set(), ticket: null });
      expect(result3).toEqual({ items: new Set(), ticket: null });
    });

    it('should parse simple dietas', () => {
      const result = parseDietas('Comida + Cena');

      expect(result.items).toEqual(new Set(['Comida', 'Cena']));
      expect(result.ticket).toBeNull();
    });

    it('should parse single dieta', () => {
      const result = parseDietas('Comida');

      expect(result.items).toEqual(new Set(['Comida']));
      expect(result.ticket).toBeNull();
    });

    it('should parse ticket with positive number', () => {
      const result = parseDietas('Comida + Ticket(25.50)');

      expect(result.items).toEqual(new Set(['Comida', 'Ticket']));
      expect(result.ticket).toBe(25.5);
    });

    it('should parse ticket with negative number', () => {
      const result = parseDietas('Ticket(-10.25)');

      expect(result.items).toEqual(new Set(['Ticket']));
      expect(result.ticket).toBe(-10.25);
    });

    it('should parse ticket with comma decimal separator', () => {
      const result = parseDietas('Ticket(15,75)');

      expect(result.items).toEqual(new Set(['Ticket']));
      expect(result.ticket).toBe(15.75);
    });

    it('should parse ticket with integer', () => {
      const result = parseDietas('Ticket(100)');

      expect(result.items).toEqual(new Set(['Ticket']));
      expect(result.ticket).toBe(100);
    });

    it('should handle multiple tickets (last one wins)', () => {
      const result = parseDietas('Ticket(10) + Comida + Ticket(20)');

      expect(result.items).toEqual(new Set(['Ticket', 'Comida']));
      expect(result.ticket).toBe(20);
    });

    it('should handle case insensitive ticket parsing', () => {
      const result = parseDietas('TICKET(15.50)');

      expect(result.items).toEqual(new Set(['Ticket']));
      expect(result.ticket).toBe(15.5);
    });

    it('should handle whitespace around parts', () => {
      const result = parseDietas('  Comida  +  Cena  +  Ticket(5)  ');

      expect(result.items).toEqual(new Set(['Comida', 'Cena', 'Ticket']));
      expect(result.ticket).toBe(5);
    });

    it('should handle empty parts', () => {
      const result = parseDietas('Comida + + Cena');

      expect(result.items).toEqual(new Set(['Comida', 'Cena']));
      expect(result.ticket).toBeNull();
    });

    it('should handle complex dietas string', () => {
      const result = parseDietas(
        'Comida + Cena + Dieta sin pernoctar + Ticket(30.25)'
      );

      expect(result.items).toEqual(
        new Set(['Comida', 'Cena', 'Dieta sin pernoctar', 'Ticket'])
      );
      expect(result.ticket).toBe(30.25);
    });
  });

  describe('formatDietas', () => {
    it('should format empty set', () => {
      const result = formatDietas(new Set(), null);

      expect(result).toBe('');
    });

    it('should format single item', () => {
      const result = formatDietas(new Set(['Comida']), null);

      expect(result).toBe('Comida');
    });

    it('should format multiple items', () => {
      const result = formatDietas(new Set(['Comida', 'Cena']), null);

      expect(result).toBe('Comida + Cena');
    });

    it('should format ticket without value', () => {
      const result = formatDietas(new Set(['Ticket']), null);

      expect(result).toBe('Ticket');
    });

    it('should format ticket with value', () => {
      const result = formatDietas(new Set(['Ticket']), 25.5);

      expect(result).toBe('Ticket(25.5)');
    });

    it('should format ticket with zero value', () => {
      const result = formatDietas(new Set(['Ticket']), 0);

      expect(result).toBe('Ticket(0)');
    });

    it('should format ticket with empty string value', () => {
      const result = formatDietas(new Set(['Ticket']), '');

      expect(result).toBe('Ticket');
    });

    it('should format mixed items with ticket', () => {
      const result = formatDietas(new Set(['Comida', 'Cena', 'Ticket']), 15.75);

      expect(result).toBe('Comida + Cena + Ticket(15.75)');
    });

    it('should format multiple items without ticket', () => {
      const result = formatDietas(
        new Set(['Comida', 'Cena', 'Dieta sin pernoctar']),
        null
      );

      expect(result).toBe('Comida + Cena + Dieta sin pernoctar');
    });

    it('should handle ticket with negative value', () => {
      const result = formatDietas(new Set(['Ticket']), -10.25);

      expect(result).toBe('Ticket(-10.25)');
    });

    it('should handle ticket with integer value', () => {
      const result = formatDietas(new Set(['Ticket']), 100);

      expect(result).toBe('Ticket(100)');
    });

    it('should handle empty set with ticket value', () => {
      const result = formatDietas(new Set(), 25);

      expect(result).toBe('');
    });

    it('should handle set without ticket but with ticket value', () => {
      const result = formatDietas(new Set(['Comida']), 25);

      expect(result).toBe('Comida');
    });
  });

  describe('parseDietas and formatDietas roundtrip', () => {
    it('should roundtrip simple dietas', () => {
      const original = 'Comida + Cena';
      const parsed = parseDietas(original);
      const formatted = formatDietas(parsed.items, parsed.ticket);

      expect(formatted).toBe(original);
    });

    it('should roundtrip dietas with ticket', () => {
      const original = 'Comida + Ticket(25.50)';
      const parsed = parseDietas(original);
      const formatted = formatDietas(parsed.items, parsed.ticket);

      // The function formats 25.50 as 25.5, so we expect that
      expect(formatted).toBe('Comida + Ticket(25.5)');
    });

    it('should roundtrip complex dietas', () => {
      const original = 'Comida + Cena + Dieta sin pernoctar + Ticket(30.25)';
      const parsed = parseDietas(original);
      const formatted = formatDietas(parsed.items, parsed.ticket);

      expect(formatted).toBe(original);
    });

    it('should handle whitespace differences in roundtrip', () => {
      const original = '  Comida  +  Cena  +  Ticket(5)  ';
      const parsed = parseDietas(original);
      const formatted = formatDietas(parsed.items, parsed.ticket);

      // Should normalize whitespace
      expect(formatted).toBe('Comida + Cena + Ticket(5)');
    });
  });
});
