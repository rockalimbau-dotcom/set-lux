import { describe, it, expect } from 'vitest';

import { createEmptyDay, createWeek } from './weeks.ts';

describe('weeks utils', () => {
  describe('createEmptyDay', () => {
    it('should create empty day object with correct structure', () => {
      const day = createEmptyDay('Lunes');

      expect(day).toEqual({
        name: 'Lunes',
        tipo: 'Rodaje',
        start: '',
        end: '',
        cut: '',
        loc: '',
        team: [],
        prelight: [],
        pickup: [],
        prelightStart: '',
        prelightEnd: '',
        pickupStart: '',
        pickupEnd: '',
        issue: '',
      });
    });

    it('should create independent day objects', () => {
      const day1 = createEmptyDay('Lunes');
      const day2 = createEmptyDay('Martes');

      day1.tipo = 'Grabación';
      day1.team.push({ role: 'DIRECTOR', name: 'Juan' });

      expect(day2.tipo).toBe('Rodaje');
      expect(day2.team).toEqual([]);
    });
  });

  describe('createWeek', () => {
    it('should create week with correct structure', () => {
      const week = createWeek('Semana 1', '2024-01-15');

      expect(week.label).toBe('Semana 1');
      expect(week.startDate).toBe('2024-01-15');
      expect(week.days).toHaveLength(7);
      expect(week.days[0]).toEqual(
        expect.objectContaining({
          name: 'Lunes',
          tipo: 'Rodaje',
          start: '',
          end: '',
          cut: '',
          loc: '',
          team: [],
          prelight: [],
          pickup: [],
          prelightStart: '',
          prelightEnd: '',
          pickupStart: '',
          pickupEnd: '',
          issue: '',
        })
      );
    });

    it('should create week with all 7 days', () => {
      const week = createWeek('Test Week', '2024-01-15');

      expect(week.days).toHaveLength(7);
      week.days.forEach((day, index) => {
        // Weekends (Saturday=5, Sunday=6) have different properties
        if (index === 5 || index === 6) {
          expect(day).toEqual(
            expect.objectContaining({
              name: expect.any(String),
              tipo: 'Descanso',
              start: '',
              end: '',
              cut: '',
              loc: 'DESCANSO',
              team: [],
              prelight: [],
              pickup: [],
              prelightStart: '',
              prelightEnd: '',
              pickupStart: '',
              pickupEnd: '',
              issue: '',
            })
          );
        } else {
          expect(day).toEqual(
            expect.objectContaining({
              name: expect.any(String),
              tipo: 'Rodaje',
              start: '',
              end: '',
              cut: '',
              loc: '',
              team: [],
              prelight: [],
              pickup: [],
              prelightStart: '',
              prelightEnd: '',
              pickupStart: '',
              pickupEnd: '',
              issue: '',
            })
          );
        }
      });
    });

    it('should handle different start dates', () => {
      const week1 = createWeek('Week 1', '2024-01-15');
      const week2 = createWeek('Week 2', '2024-01-22');

      expect(week1.startDate).toBe('2024-01-15');
      expect(week2.startDate).toBe('2024-01-22');
    });

    it('should create independent week objects', () => {
      const week1 = createWeek('Week 1', '2024-01-15');
      const week2 = createWeek('Week 2', '2024-01-22');

      week1.days[0].tipo = 'Grabación';
      week1.days[0].team.push({ role: 'DIRECTOR', name: 'Juan' });

      expect(week2.days[0].tipo).toBe('Rodaje');
      expect(week2.days[0].team).toEqual([]);
    });
  });
});
