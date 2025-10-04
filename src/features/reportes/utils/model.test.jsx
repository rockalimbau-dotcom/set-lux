import { describe, it, expect } from 'vitest';
import { stripPR, personaRole, personaName, personaKey, seedWeekData } from './model.ts';

describe('reportes/utils/model', () => {
  describe('stripPR', () => {
    it('removes P suffix from role', () => {
      expect(stripPR('G1P')).toBe('G1');
      expect(stripPR('E2P')).toBe('E2');
      expect(stripPR('REF1P')).toBe('REF1');
    });

    it('removes R suffix from role', () => {
      expect(stripPR('G1R')).toBe('G1');
      expect(stripPR('E2R')).toBe('E2');
      expect(stripPR('REF1R')).toBe('REF1');
    });

    it('removes only the last P or R suffix', () => {
      expect(stripPR('G1PP')).toBe('G1P');
      expect(stripPR('G1RR')).toBe('G1R');
      expect(stripPR('G1PR')).toBe('G1P');
    });

    it('handles empty or null input', () => {
      expect(stripPR('')).toBe('');
      expect(stripPR(null)).toBe('');
      expect(stripPR(undefined)).toBe('');
    });

    it('does not modify roles without P or R suffix', () => {
      expect(stripPR('G1')).toBe('G1');
      expect(stripPR('E2')).toBe('E2');
      expect(stripPR('REF1')).toBe('REF1');
    });
  });

  describe('personaRole', () => {
    it('extracts role from object with role property', () => {
      expect(personaRole({ role: 'G1' })).toBe('G1');
      expect(personaRole({ role: 'E2' })).toBe('E2');
    });

    it('extracts cargo from object with cargo property', () => {
      expect(personaRole({ cargo: 'G1' })).toBe('G1');
      expect(personaRole({ cargo: 'E2' })).toBe('E2');
    });

    it('prefers role over cargo', () => {
      expect(personaRole({ role: 'G1', cargo: 'E2' })).toBe('G1');
    });

    it('returns empty string for string input', () => {
      expect(personaRole('G1')).toBe('');
    });

    it('returns empty string for null or undefined', () => {
      expect(personaRole(null)).toBe('');
      expect(personaRole(undefined)).toBe('');
    });

    it('returns empty string for non-object input', () => {
      expect(personaRole(123)).toBe('');
      expect(personaRole(true)).toBe('');
    });
  });

  describe('personaName', () => {
    it('returns string input as is', () => {
      expect(personaName('John Doe')).toBe('John Doe');
    });

    it('extracts name from object with name property', () => {
      expect(personaName({ name: 'John Doe' })).toBe('John Doe');
    });

    it('extracts nombre from object with nombre property', () => {
      expect(personaName({ nombre: 'John Doe' })).toBe('John Doe');
    });

    it('extracts label from object with label property', () => {
      expect(personaName({ label: 'John Doe' })).toBe('John Doe');
    });

    it('prefers name over other properties', () => {
      expect(personaName({ name: 'John', nombre: 'Juan', label: 'Johnny' })).toBe('John');
    });

    it('handles null or undefined input', () => {
      expect(personaName(null)).toBe('');
      expect(personaName(undefined)).toBe('');
    });

    it('converts non-string non-object to string', () => {
      expect(personaName(123)).toBe('123');
      expect(personaName(true)).toBe('true');
    });
  });

  describe('personaKey', () => {
    it('creates key from role and name', () => {
      expect(personaKey({ role: 'G1', name: 'John' })).toBe('G1__John');
    });

    it('strips PR suffix from role', () => {
      expect(personaKey({ role: 'G1P', name: 'John' })).toBe('G1__John');
      expect(personaKey({ role: 'G1R', name: 'John' })).toBe('G1__John');
    });

    it('handles REF roles specially', () => {
      expect(personaKey({ role: 'REF1', name: 'John' })).toBe('REF__John');
      expect(personaKey({ role: 'REF2P', name: 'John' })).toBe('REF__John');
    });

    it('handles roles that start with REF', () => {
      expect(personaKey({ role: 'REFERENCIA', name: 'John' })).toBe('REF__John');
    });

    it('handles empty role and name', () => {
      const result = personaKey({});
      expect(result).toMatch(/^UNKNOWN__[a-z0-9]{9}$/);
    });

    it('handles string input', () => {
      expect(personaKey('John')).toBe('UNKNOWN__John');
    });
  });

  describe('seedWeekData', () => {
    it('creates empty data structure for empty personas', () => {
      const result = seedWeekData([], []);
      expect(result).toEqual({});
    });

    it('creates data structure for personas and week', () => {
      const personas = [
        { role: 'G1', name: 'John' },
        { role: 'E2', name: 'Jane' },
      ];
      const semana = ['2023-01-01', '2023-01-02'];

      const result = seedWeekData(personas, semana);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['G1__John']).toBeDefined();
      expect(result['E2__Jane']).toBeDefined();

      // Check concepts
      const concepts = ['Dietas', 'Transporte', 'Kilometraje', 'Nocturnidad', 'Horas extra', 'Turn Around', 'Penalty lunch'];
      expect(Object.keys(result['G1__John'])).toEqual(concepts);

      // Check dates
      expect(Object.keys(result['G1__John']['Dietas'])).toEqual(semana);
      expect(result['G1__John']['Dietas']['2023-01-01']).toBe('');
    });

    it('handles personas with PR suffixes', () => {
      const personas = [
        { role: 'G1P', name: 'John' },
        { role: 'E2R', name: 'Jane' },
      ];
      const semana = ['2023-01-01'];

      const result = seedWeekData(personas, semana);

      expect(result['G1__John']).toBeDefined();
      expect(result['E2__Jane']).toBeDefined();
    });

    it('handles REF roles', () => {
      const personas = [
        { role: 'REF1', name: 'John' },
        { role: 'REF2P', name: 'Jane' },
      ];
      const semana = ['2023-01-01'];

      const result = seedWeekData(personas, semana);

      expect(result['REF__John']).toBeDefined();
      expect(result['REF__Jane']).toBeDefined();
    });
  });
});
