import { describe, it, expect } from 'vitest';
import { 
  stripPR, 
  isMemberRefuerzo, 
  buildRefuerzoIndex, 
  weekISOdays, 
  weekAllPeopleActive 
} from './plan';

describe('plan.ts', () => {
  describe('stripPR', () => {
    it('should remove P suffix', () => {
      expect(stripPR('GAFFERP')).toBe('GAFFER');
      expect(stripPR('ELECTRICOP')).toBe('ELECTRICO');
    });

    it('should remove R suffix', () => {
      expect(stripPR('GAFFERR')).toBe('GAFFER');
      expect(stripPR('ELECTRICOR')).toBe('ELECTRICO');
    });

    it('should not remove P or R in the middle', () => {
      expect(stripPR('GAFFERPRE')).toBe('GAFFERPRE');
      expect(stripPR('ELECTRICO')).toBe('ELECTRICO');
    });

    it('should handle empty or null values', () => {
      expect(stripPR('')).toBe('');
      expect(stripPR(null)).toBe('');
    });
  });

  describe('isMemberRefuerzo', () => {
    it('should return true for refuerzo flag', () => {
      expect(isMemberRefuerzo({ refuerzo: true })).toBe(true);
    });

    it('should return true for role with REF', () => {
      expect(isMemberRefuerzo({ role: 'REF' })).toBe(true);
      expect(isMemberRefuerzo({ role: 'REFUERZO' })).toBe(true);
      expect(isMemberRefuerzo({ role: 'gaffer_ref' })).toBe(true);
    });

    it('should return true for name with REF', () => {
      expect(isMemberRefuerzo({ name: 'REF Juan' })).toBe(true);
      expect(isMemberRefuerzo({ name: 'Refuerzo Pedro' })).toBe(true);
    });

    it('should return false for regular members', () => {
      expect(isMemberRefuerzo({ role: 'GAFFER', name: 'Juan' })).toBe(false);
      expect(isMemberRefuerzo({ role: 'DIRECTOR' })).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isMemberRefuerzo(null)).toBe(false);
      expect(isMemberRefuerzo({})).toBe(false);
    });
  });

  describe('buildRefuerzoIndex', () => {
    it('should build refuerzo index from weeks', () => {
      const weeks = [{
        days: [{
          team: [
            { role: 'GAFFER', name: 'Juan' },
            { role: 'REF', name: 'Pedro' }
          ]
        }]
      }];

      const index = buildRefuerzoIndex(weeks);
      expect(index.has('REF__Pedro')).toBe(true); // REF role is preserved
      expect(index.has('GAFFER__Juan')).toBe(false);
    });

    it('should handle prelight and pickup teams', () => {
      const weeks = [{
        days: [{
          prelight: [{ role: 'REF', name: 'Luis' }],
          pickup: [{ role: 'REF', name: 'Maria' }]
        }]
      }];

      const index = buildRefuerzoIndex(weeks);
      expect(index.has('REF__Luis')).toBe(true); // REF role is preserved
      expect(index.has('REF__Maria')).toBe(true);
    });

    it('should handle members with refuerzo flag', () => {
      const weeks = [{
        days: [{
          team: [
            { role: 'GAFFER', name: 'Juan', refuerzo: true }
          ]
        }]
      }];

      const index = buildRefuerzoIndex(weeks);
      expect(index.has('GAFFE__Juan')).toBe(true); // stripPR removes trailing R, so GAFFER becomes GAFFE
    });

    it('should return empty set for no refuerzo members', () => {
      const weeks = [{
        days: [{
          team: [
            { role: 'GAFFER', name: 'Juan' },
            { role: 'ELECTRICO', name: 'Pedro' }
          ]
        }]
      }];

      const index = buildRefuerzoIndex(weeks);
      expect(index.size).toBe(0);
    });

    it('should handle empty or null weeks', () => {
      expect(buildRefuerzoIndex([]).size).toBe(0);
      expect(buildRefuerzoIndex(null).size).toBe(0);
    });
  });

  describe('weekISOdays', () => {
    it('should generate ISO days for a week', () => {
      const week = { startDate: '2025-10-13' };
      const days = weekISOdays(week);
      
      expect(days).toHaveLength(7);
      expect(days[0]).toBe('2025-10-13');
      expect(days[1]).toBe('2025-10-14');
      expect(days[6]).toBe('2025-10-19');
    });

    it('should handle different start dates', () => {
      const week = { startDate: '2024-01-01' };
      const days = weekISOdays(week);
      
      expect(days[0]).toBe('2024-01-01');
      expect(days[6]).toBe('2024-01-07');
    });
  });

  describe('weekAllPeopleActive', () => {
    it('should extract all unique people from a week', () => {
      const week = {
        days: [{
          team: [
            { role: 'GAFFER', name: 'Juan' },
            { role: 'ELECTRICO', name: 'Pedro' }
          ]
        }]
      };

      const people = weekAllPeopleActive(week);
      expect(people).toHaveLength(2);
      expect(people[0]).toEqual({ role: 'GAFFER', name: 'Juan' });
      expect(people[1]).toEqual({ role: 'ELECTRICO', name: 'Pedro' });
    });

    it('should remove duplicates', () => {
      const week = {
        days: [
          { team: [{ role: 'GAFFER', name: 'Juan' }] },
          { team: [{ role: 'GAFFER', name: 'Juan' }] }
        ]
      };

      const people = weekAllPeopleActive(week);
      expect(people).toHaveLength(1);
    });

    it('should include people from different day teams', () => {
      const week = {
        days: [
          { team: [{ role: 'GAFFER', name: 'Juan' }] },
          { prelight: [{ role: 'ELECTRICO', name: 'Pedro' }] },
          { pickup: [{ role: 'DIRECTOR', name: 'Maria' }] }
        ]
      };

      const people = weekAllPeopleActive(week);
      expect(people).toHaveLength(3);
    });

    it('should generate default names for people without names', () => {
      const week = {
        days: [{
          team: [
            { role: 'GAFFER' },
            { role: 'ELECTRICO', name: 'Pedro' }
          ]
        }]
      };

      const people = weekAllPeopleActive(week);
      expect(people.find(p => p.role === 'GAFFER')).toEqual({
        role: 'GAFFER',
        name: 'Persona_GAFFER'
      });
    });

    it('should handle empty or null weeks', () => {
      expect(weekAllPeopleActive({})).toEqual([]);
      expect(weekAllPeopleActive(null)).toEqual([]);
      expect(weekAllPeopleActive({ days: [] })).toEqual([]);
    });
  });
});

