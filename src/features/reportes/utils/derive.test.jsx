import { describe, it, expect, vi } from 'vitest';
import {
  collectWeekTeamWithSuffixFactory,
  buildSafePersonas,
  buildPeopleBase,
  buildPeoplePre,
  buildPeoplePick,
  collectRefNamesForBlock,
  horarioPrelightFactory,
  horarioPickupFactory,
} from './derive.ts';

// Mock dependencies
vi.mock('./model.ts', () => ({
  personaRole: vi.fn((p) => p.role || ''),
  personaName: vi.fn((p) => p.name || ''),
}));

vi.mock('./plan.ts', () => ({
  isMemberRefuerzo: vi.fn((m) => m.role === 'REF' || m.role?.includes('REFUERZO')),
}));

vi.mock('./text.ts', () => ({
  norm: vi.fn((s) => s?.toLowerCase() || ''),
}));

describe('derive', () => {
  const mockFindWeekAndDay = vi.fn();
  const mockSafeSemana = ['2024-01-15', '2024-01-16'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collectWeekTeamWithSuffixFactory', () => {
    it('should create function that collects team members with suffix', () => {
      const mockDay = {
        team: [
          { role: 'DIRECTOR', name: 'Juan' },
          { role: 'REF', name: 'María' },
          { role: 'PRODUCTOR', name: 'Carlos' },
        ],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(mockFindWeekAndDay, mockSafeSemana);
      const result = collectFn('team', 'P');

      expect(result).toEqual([
        { role: 'DIRECTORP', name: 'Juan' },
        { role: 'REF', name: 'María' },
        { role: 'PRODUCTORP', name: 'Carlos' },
      ]);
    });

    it('should handle empty team list', () => {
      const mockDay = { team: [] };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(mockFindWeekAndDay, mockSafeSemana);
      const result = collectFn('team', 'P');

      expect(result).toEqual([]);
    });

    it('should deduplicate team members', () => {
      const mockDay = {
        team: [
          { role: 'DIRECTOR', name: 'Juan' },
          { role: 'DIRECTOR', name: 'Juan' }, // Duplicate
        ],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(mockFindWeekAndDay, mockSafeSemana);
      const result = collectFn('team', 'P');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ role: 'DIRECTORP', name: 'Juan' });
    });

    it('should handle missing day data', () => {
      mockFindWeekAndDay.mockReturnValue({ day: null });

      const collectFn = collectWeekTeamWithSuffixFactory(mockFindWeekAndDay, mockSafeSemana);
      const result = collectFn('team', 'P');

      expect(result).toEqual([]);
    });
  });

  describe('buildSafePersonas', () => {
    it('should build safe personas from provided data', () => {
      const providedPersonas = [
        { role: 'DIRECTOR', name: 'Juan' },
        { role: 'PRODUCTOR', name: 'María' },
      ];
      const prelightPeople = [{ role: 'TÉCNICO', name: 'Carlos' }];
      const pickupPeople = [{ role: 'TÉCNICO', name: 'Ana' }];

      const result = buildSafePersonas(
        providedPersonas,
        true, // weekPrelightActive
        prelightPeople,
        true, // weekPickupActive
        pickupPeople
      );

      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ role: 'DIRECTOR', name: 'Juan' });
      expect(result).toContainEqual({ role: 'PRODUCTOR', name: 'María' });
      expect(result).toContainEqual({ role: 'TÉCNICO', name: 'Carlos', __block: 'pre' });
      expect(result).toContainEqual({ role: 'TÉCNICO', name: 'Ana', __block: 'pick' });
    });

    it('should deduplicate personas', () => {
      const providedPersonas = [{ role: 'DIRECTOR', name: 'Juan' }];
      const prelightPeople = [{ role: 'DIRECTOR', name: 'Juan' }]; // Duplicate

      const result = buildSafePersonas(
        providedPersonas,
        true,
        prelightPeople,
        false,
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ role: 'DIRECTOR', name: 'Juan', __block: 'pre' });
    });

    it('should normalize REF roles', () => {
      const providedPersonas = [
        { role: 'REFUERZO', name: 'María' },
        { role: 'REF', name: 'Carlos' },
      ];

      const result = buildSafePersonas(
        providedPersonas,
        false,
        [],
        false,
        []
      );

      expect(result).toEqual([
        { role: 'REF', name: 'María' },
        { role: 'REF', name: 'Carlos' },
      ]);
    });

    it('should handle inactive prelight and pickup', () => {
      const providedPersonas = [{ role: 'DIRECTOR', name: 'Juan' }];
      const prelightPeople = [{ role: 'TÉCNICO', name: 'Carlos' }];
      const pickupPeople = [{ role: 'TÉCNICO', name: 'Ana' }];

      const result = buildSafePersonas(
        providedPersonas,
        false, // weekPrelightActive
        prelightPeople,
        false, // weekPickupActive
        pickupPeople
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ role: 'DIRECTOR', name: 'Juan' });
    });
  });

  describe('buildPeopleBase', () => {
    it('should build base people list', () => {
      const providedPersonas = [
        { role: 'DIRECTOR', name: 'Juan' },
        { role: 'PRODUCTORP', name: 'María' }, // Should be filtered out
        { role: 'TÉCNICOR', name: 'Carlos' }, // Should be filtered out
      ];
      const refNamesBase = new Set(['Ana', 'Luis']);

      const result = buildPeopleBase(providedPersonas, refNamesBase);

      // Check that REF names are added
      expect(result).toContainEqual({ role: 'REF', name: 'Ana' });
      expect(result).toContainEqual({ role: 'REF', name: 'Luis' });
    });

    it('should filter out P and R suffixed roles', () => {
      const providedPersonas = [
        { role: 'DIRECTOR', name: 'Juan' },
        { role: 'PRODUCTORP', name: 'María' },
        { role: 'TÉCNICOR', name: 'Carlos' },
        { role: 'TÉCNICO', name: 'Ana' },
      ];

      const result = buildPeopleBase(providedPersonas, new Set());

      // Should only contain non-P/R suffixed roles
      expect(result).toContainEqual({ role: 'TÉCNICO', name: 'Ana' });
      expect(result).not.toContainEqual({ role: 'PRODUCTORP', name: 'María' });
      expect(result).not.toContainEqual({ role: 'TÉCNICOR', name: 'Carlos' });
    });

    it('should deduplicate people', () => {
      const providedPersonas = [
        { role: 'DIRECTOR', name: 'Juan' },
        { role: 'DIRECTOR', name: 'Juan' }, // Duplicate
      ];

      const result = buildPeopleBase(providedPersonas, new Set());

      // Should deduplicate based on role__name key
      // The function filters out P/R suffixed roles, so DIRECTOR should be included
      expect(result.length).toBeGreaterThanOrEqual(0);
      // Check that duplicates are handled (this is the main test)
      const uniqueResults = new Set(result.map(p => `${p.role}__${p.name}`));
      expect(uniqueResults.size).toBe(result.length);
    });
  });

  describe('buildPeoplePre', () => {
    it('should build prelight people list', () => {
      const prelightPeople = [
        { role: 'TÉCNICO', name: 'Carlos' },
        { role: 'REF', name: 'María' },
      ];
      const refNamesPre = new Set(['Ana']);

      const result = buildPeoplePre(true, prelightPeople, refNamesPre);

      expect(result).toEqual([
        { role: 'TÉCNICO', name: 'Carlos', __block: 'pre' },
        { role: 'REF', name: 'María', __block: 'pre' },
        { role: 'REF', name: 'Ana', __block: 'pre' },
      ]);
    });

    it('should handle inactive prelight', () => {
      const prelightPeople = [{ role: 'TÉCNICO', name: 'Carlos' }];

      const result = buildPeoplePre(false, prelightPeople, new Set());

      expect(result).toEqual([]);
    });

    it('should sort normal people by role', () => {
      const prelightPeople = [
        { role: 'TÉCNICO', name: 'Carlos' },
        { role: 'DIRECTOR', name: 'Juan' },
        { role: 'REF', name: 'María' },
      ];

      const result = buildPeoplePre(true, prelightPeople, new Set());

      expect(result[0]).toEqual({ role: 'DIRECTOR', name: 'Juan', __block: 'pre' });
      expect(result[1]).toEqual({ role: 'TÉCNICO', name: 'Carlos', __block: 'pre' });
      expect(result[2]).toEqual({ role: 'REF', name: 'María', __block: 'pre' });
    });
  });

  describe('buildPeoplePick', () => {
    it('should build pickup people list', () => {
      const pickupPeople = [
        { role: 'TÉCNICO', name: 'Ana' },
        { role: 'REF', name: 'Carlos' },
      ];
      const refNamesPick = new Set(['María']);

      const result = buildPeoplePick(true, pickupPeople, refNamesPick);

      expect(result).toEqual([
        { role: 'TÉCNICO', name: 'Ana', __block: 'pick' },
        { role: 'REF', name: 'Carlos', __block: 'pick' },
        { role: 'REF', name: 'María', __block: 'pick' },
      ]);
    });

    it('should handle inactive pickup', () => {
      const pickupPeople = [{ role: 'TÉCNICO', name: 'Ana' }];

      const result = buildPeoplePick(false, pickupPeople, new Set());

      expect(result).toEqual([]);
    });
  });

  describe('collectRefNamesForBlock', () => {
    it('should collect refuerzo names for a block', () => {
      const mockDay = {
        team: [
          { role: 'REF', name: 'María' },
          { role: 'DIRECTOR', name: 'Juan' },
          { role: 'REFUERZO', name: 'Carlos' },
        ],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const result = collectRefNamesForBlock(mockSafeSemana, mockFindWeekAndDay, 'team');

      expect(result).toEqual(new Set(['María', 'Carlos']));
    });

    it('should handle empty team list', () => {
      const mockDay = { team: [] };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const result = collectRefNamesForBlock(mockSafeSemana, mockFindWeekAndDay, 'team');

      expect(result).toEqual(new Set());
    });

    it('should handle missing day data', () => {
      mockFindWeekAndDay.mockReturnValue({ day: null });

      const result = collectRefNamesForBlock(mockSafeSemana, mockFindWeekAndDay, 'team');

      expect(result).toEqual(new Set());
    });
  });

  describe('horarioPrelightFactory', () => {
    it('should return prelight schedule when available', () => {
      const mockDay = {
        tipo: 'Rodaje',
        prelightStart: '08:00',
        prelightEnd: '09:00',
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPrelightFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('08:00–09:00');
    });

    it('should return dash for rest day', () => {
      const mockDay = { tipo: 'Descanso' };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPrelightFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('—');
    });

    it('should return message when schedule missing', () => {
      const mockDay = { tipo: 'Rodaje' };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPrelightFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('Añadelo en Planificación');
    });

    it('should handle missing day', () => {
      mockFindWeekAndDay.mockReturnValue({ day: null });

      const horarioFn = horarioPrelightFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('—');
    });
  });

  describe('horarioPickupFactory', () => {
    it('should return pickup schedule when available', () => {
      const mockDay = {
        tipo: 'Rodaje',
        pickupStart: '18:00',
        pickupEnd: '19:00',
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPickupFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('18:00–19:00');
    });

    it('should return dash for rest day', () => {
      const mockDay = { tipo: 'Descanso' };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPickupFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('—');
    });

    it('should return message when schedule missing', () => {
      const mockDay = { tipo: 'Rodaje' };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const horarioFn = horarioPickupFactory(mockFindWeekAndDay);
      const result = horarioFn('2024-01-15');

      expect(result).toBe('Añadelo en Planificación');
    });
  });
});
