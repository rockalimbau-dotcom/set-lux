import { describe, it, expect } from 'vitest';
import { parseNum, parseDietasValue } from './parse';

describe('parse.ts', () => {
  describe('parseNum', () => {
    it('should parse simple numbers', () => {
      expect(parseNum('100')).toBe(100);
      expect(parseNum('50')).toBe(50);
      expect(parseNum('0')).toBe(0);
    });

    it('should parse numbers with dots as thousands separator', () => {
      expect(parseNum('1.000')).toBe(1000);
      expect(parseNum('50.000')).toBe(50000);
    });

    it('should parse numbers with commas as decimal separator', () => {
      expect(parseNum('100,50')).toBe(100.5);
      expect(parseNum('25,75')).toBe(25.75);
    });

    it('should handle mixed dots and commas', () => {
      expect(parseNum('1.234,56')).toBe(1234.56);
    });

    it('should return 0 for null or empty values', () => {
      expect(parseNum(null)).toBe(0);
      expect(parseNum('')).toBe(0);
      expect(parseNum(undefined)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(parseNum('abc')).toBe(0);
      expect(parseNum('.50')).toBe(50); // Points are removed first, so .50 becomes 50
    });
  });

  describe('parseDietasValue', () => {
    it('should parse simple dietas labels', () => {
      const result = parseDietasValue('Comida');
      expect(result.labels).toEqual(['Comida']);
      expect(result.ticket).toBe(0);
    });

    it('should parse multiple dietas separated by +', () => {
      const result = parseDietasValue('Comida + Cena');
      expect(result.labels).toHaveLength(2);
      expect(result.labels).toContain('Comida');
      expect(result.labels).toContain('Cena');
    });

    it('should parse ticket values', () => {
      const result = parseDietasValue('Ticket(12)');
      expect(result.labels).toContain('Ticket');
      expect(result.ticket).toBe(12);
    });

    it('should parse ticket with colon', () => {
      const result = parseDietasValue('Ticket: 15');
      expect(result.labels).toContain('Ticket');
      expect(result.ticket).toBe(15);
    });

    it('should parse JSON array format', () => {
      const result = parseDietasValue('["Comida", "Desayuno"]');
      expect(result.labels).toHaveLength(2);
    });

    it('should normalize dietas labels', () => {
      const result = parseDietasValue('gastos de bolsillo');
      expect(result.labels).toContain('Gastos de bolsillo');
    });

    it('should handle normalizations', () => {
      expect(parseDietasValue('dieta completa')).toEqual(expect.objectContaining({
        labels: expect.arrayContaining(['Dieta completa + desayuno'])
      }));
      
      expect(parseDietasValue('dieta sin')).toEqual(expect.objectContaining({
        labels: expect.arrayContaining(['Dieta sin pernoctar'])
      }));
    });

    it('should return empty for null or empty values', () => {
      expect(parseDietasValue(null)).toEqual({ labels: [], ticket: 0 });
      expect(parseDietasValue('')).toEqual({ labels: [], ticket: 0 });
    });

    it('should remove duplicates', () => {
      const result = parseDietasValue('Comida + Comida + Cena');
      expect(result.labels).toHaveLength(2);
    });

    it('should sum multiple ticket values', () => {
      const result = parseDietasValue('Ticket(10) + Ticket(5)');
      expect(result.labels).toContain('Ticket');
      expect(result.ticket).toBe(15);
    });
  });
});

