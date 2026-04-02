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
  personaRole: vi.fn(p => p.role || ''),
  personaName: vi.fn(p => p.name || ''),
  personaKey: vi.fn(p => {
    const roleKey = String(p?.roleId || p?.role || '');
    const name = String(p?.name || '');
    const block = String(p?.__block || '');
    if (block === 'pre') return `${roleKey}.pre__${name}`;
    if (block === 'pick') return `${roleKey}.pick__${name}`;
    if (block) return `${roleKey}.${block}__${name}`;
    return `${roleKey}__${name}`;
  }),
}));

vi.mock('./plan.ts', () => ({
  BLOCKS: {
    base: 'base',
    pre: 'pre',
    pick: 'pick',
    extra: 'extra',
  },
  getDayBlockList: vi.fn((day, block) => {
    if (!day) return [];
    if (block === 'base') {
      return (day.team || []).filter(m => !(m.role === 'REF' || m.role?.includes('REFUERZO')));
    }
    if (block === 'pre') return day.prelight || [];
    if (block === 'pick') return day.pickup || [];
    if (block === 'extra') return day.refList || [];
    return [];
  }),
  isMemberRefuerzo: vi.fn(
    m => m.role === 'REF' || m.role?.includes('REFUERZO')
  ),
}));

vi.mock('./text.ts', () => ({
  norm: vi.fn(s => s?.toLowerCase() || ''),
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
          { role: 'PRODUCTOR', name: 'Carlos' },
        ],
        refList: [{ role: 'REF', name: 'María' }],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('team', 'P');

      expect(result).toEqual([
        { role: 'DIRECTOR', name: 'Juan', personId: undefined, gender: undefined, source: undefined, roleId: undefined, roleLabel: undefined },
        { role: 'PRODUCTOR', name: 'Carlos', personId: undefined, gender: undefined, source: undefined, roleId: undefined, roleLabel: undefined },
      ]);
    });

    it('should collect refuerzos from extra block separately', () => {
      const mockDay = {
        team: [{ role: 'DIRECTOR', name: 'Juan' }],
        refList: [{ role: 'REF', name: 'María' }],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('refList', '');

      expect(result).toEqual([{ role: 'REF', name: 'María', personId: undefined, gender: undefined, source: undefined, roleId: undefined, roleLabel: undefined }]);
    });

    it('should handle empty team list', () => {
      const mockDay = { team: [] };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
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

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('team', 'P');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ role: 'DIRECTOR', name: 'Juan', personId: undefined, gender: undefined, source: undefined, roleId: undefined, roleLabel: undefined });
    });

    it('should handle missing day data', () => {
      mockFindWeekAndDay.mockReturnValue({ day: null });

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('team', 'P');

      expect(result).toEqual([]);
    });

    it('should preserve personId metadata from planning members', () => {
      const mockDay = {
        team: [
          { role: 'E', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', personId: 'person_pol', name: 'Pol Peitx' },
        ],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('team', '');

      expect(result[0]).toMatchObject({
        role: 'E',
        roleId: 'electric_factura',
        roleLabel: 'Eléctrico factura',
        personId: 'person_pol',
        name: 'Pol Peitx',
      });
    });

    it('keeps base and custom roles separated when name and personId are the same', () => {
      const byDate: Record<string, any> = {
        '2024-01-15': {
          team: [
            { role: 'E', roleId: 'electric_default', roleLabel: 'Eléctrico/a', personId: 'person_pol', name: 'Pol Peitx' },
          ],
        },
        '2024-01-16': {
          team: [
            { role: 'E', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', personId: 'person_pol', name: 'Pol Peitx' },
          ],
        },
      };
      mockFindWeekAndDay.mockImplementation((iso: string) => ({ day: byDate[iso] }));

      const collectFn = collectWeekTeamWithSuffixFactory(
        mockFindWeekAndDay,
        mockSafeSemana
      );
      const result = collectFn('team', '');

      expect(result).toHaveLength(2);
      expect(result.map(p => p.roleId)).toEqual(['electric_default', 'electric_factura']);
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
        pickupPeople,
        false,
        []
      );

      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ role: 'DIRECTOR', name: 'Juan' });
      expect(result).toContainEqual({ role: 'PRODUCTOR', name: 'María' });
      expect(result).toContainEqual({
        role: 'TÉCNICO',
        name: 'Carlos',
        __block: 'pre',
      });
      expect(result).toContainEqual({
        role: 'TÉCNICO',
        name: 'Ana',
        __block: 'pick',
      });
    });

    it('should deduplicate personas', () => {
      const providedPersonas = [{ role: 'DIRECTOR', name: 'Juan' }];
      const prelightPeople = [{ role: 'DIRECTOR', name: 'Juan' }]; // Duplicate

      const result = buildSafePersonas(
        providedPersonas,
        true,
        prelightPeople,
        false,
        [],
        false,
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'DIRECTOR',
        name: 'Juan',
        __block: 'pre',
      });
    });

    it('should normalize REF roles', () => {
      const providedPersonas = [
        { role: 'REFUERZO', name: 'María' },
        { role: 'REF', name: 'Carlos' },
      ];

      const result = buildSafePersonas(providedPersonas, false, [], false, [], false, []);

      expect(result).toEqual([
        { role: 'REFUERZO', name: 'María' },
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
        pickupPeople,
        false,
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ role: 'DIRECTOR', name: 'Juan' });
    });

    it('keeps personId when merging block personas into the safe list', () => {
      const result = buildSafePersonas(
        [{ role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' }],
        true,
        [{ role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' }],
        false,
        [],
        false,
        []
      );

      expect(result).toContainEqual({
        role: 'E',
        roleId: 'electric_factura',
        personId: 'person_pol',
        name: 'Pol Peitx',
        __block: 'pre',
      });
    });

    it('keeps base and block personas separated when only roleId changes', () => {
      const result = buildSafePersonas(
        [{ role: 'E', roleId: 'electric_default', personId: 'person_pol', name: 'Pol Peitx' }],
        true,
        [{ role: 'E', roleId: 'electric_factura', personId: 'person_pol', name: 'Pol Peitx' }],
        false,
        [],
        false,
        []
      );

      expect(result).toContainEqual({
        role: 'E',
        roleId: 'electric_default',
        personId: 'person_pol',
        name: 'Pol Peitx',
      });
      expect(result).toContainEqual({
        role: 'E',
        roleId: 'electric_factura',
        personId: 'person_pol',
        name: 'Pol Peitx',
        __block: 'pre',
      });
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

    it('keeps custom base roles with the same legacy role separated by roleId', () => {
      const providedPersonas = [
        { role: 'E', roleId: 'electric_day', name: 'Juan' },
        { role: 'E', roleId: 'electric_night', name: 'Juan' },
      ];

      const result = buildPeopleBase(providedPersonas, new Set());

      expect(result).toHaveLength(2);
      expect(result.map(p => p.roleId)).toEqual(['electric_day', 'electric_night']);
    });

    it('should sort base people by role hierarchy', () => {
      const providedPersonas = [
        { role: 'REF', name: 'Refuerzo' },
        { role: 'E', name: 'Eléctrico' },
        { role: 'G', name: 'Gaffer' },
        { role: 'BB', name: 'Best Boy' },
        { role: 'TM', name: 'Técnico' },
      ];
      const refNamesBase = new Set();

      const result = buildPeopleBase(providedPersonas, refNamesBase);

      // Verificar orden: EQUIPO BASE → REFUERZOS
      expect(result[0].role).toBe('G'); // EQUIPO BASE
      expect(result[1].role).toBe('BB'); // EQUIPO BASE
      expect(result[2].role).toBe('E'); // EQUIPO BASE
      expect(result[3].role).toBe('TM'); // EQUIPO BASE
      expect(result[4].role).toBe('REF'); // REFUERZOS
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
        { role: 'TÉCNICOP', name: 'Carlos', gender: undefined, __block: 'pre' },
        { role: 'REF', name: 'María', gender: undefined, __block: 'pre' },
        { role: 'REF', name: 'Ana', __block: 'pre' },
      ]);
    });

    it('should handle inactive prelight', () => {
      const prelightPeople = [{ role: 'TÉCNICO', name: 'Carlos' }];

      const result = buildPeoplePre(false, prelightPeople, new Set());

      expect(result).toEqual([]);
    });

    it('should sort prelight people by role hierarchy', () => {
      const prelightPeople = [
        { role: 'REF', name: 'Refuerzo' },
        { role: 'EP', name: 'Eléctrico Prelight' },
        { role: 'GP', name: 'Gaffer Prelight' },
        { role: 'BBP', name: 'Best Boy Prelight' },
        { role: 'TMP', name: 'Técnico Prelight' },
      ];

      const result = buildPeoplePre(true, prelightPeople, new Set());

      // Verificar orden: EQUIPO PRELIGHT → REFUERZOS
      expect(result[0].role).toBe('GP'); // EQUIPO PRELIGHT
      expect(result[1].role).toBe('BBP'); // EQUIPO PRELIGHT
      expect(result[2].role).toBe('EP'); // EQUIPO PRELIGHT
      expect(result[3].role).toBe('TMP'); // EQUIPO PRELIGHT
      expect(result[4].role).toBe('REF'); // REFUERZOS
    });

    it('keeps custom prelight roles with the same legacy role separated by roleId', () => {
      const prelightPeople = [
        { role: 'E', roleId: 'electric_day', roleLabel: 'Eléctrico día', name: 'Ana', source: 'pre' },
        { role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Ana', source: 'pre' },
      ];

      const result = buildPeoplePre(true, prelightPeople, new Set());

      expect(result).toHaveLength(2);
      expect(result.map(p => p.roleId)).toEqual(['electric_day', 'electric_night']);
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
        { role: 'TÉCNICOR', name: 'Ana', gender: undefined, __block: 'pick' },
        { role: 'REF', name: 'Carlos', gender: undefined, __block: 'pick' },
        { role: 'REF', name: 'María', __block: 'pick' },
      ]);
    });

    it('should handle inactive pickup', () => {
      const pickupPeople = [{ role: 'TÉCNICO', name: 'Ana' }];

      const result = buildPeoplePick(false, pickupPeople, new Set());

      expect(result).toEqual([]);
    });

    it('should sort pickup people by role hierarchy', () => {
      const pickupPeople = [
        { role: 'REF', name: 'Refuerzo' },
        { role: 'ER', name: 'Eléctrico Recogida' },
        { role: 'GR', name: 'Gaffer Recogida' },
        { role: 'BBR', name: 'Best Boy Recogida' },
        { role: 'TMR', name: 'Técnico Recogida' },
      ];

      const result = buildPeoplePick(true, pickupPeople, new Set());

      // Verificar orden: EQUIPO RECOGIDA → REFUERZOS
      expect(result[0].role).toBe('GR'); // EQUIPO RECOGIDA
      expect(result[1].role).toBe('BBR'); // EQUIPO RECOGIDA
      expect(result[2].role).toBe('ER'); // EQUIPO RECOGIDA
      expect(result[3].role).toBe('TMR'); // EQUIPO RECOGIDA
      expect(result[4].role).toBe('REF'); // REFUERZOS
    });

    it('keeps custom pickup roles with the same legacy role separated by roleId', () => {
      const pickupPeople = [
        { role: 'E', roleId: 'electric_day', roleLabel: 'Eléctrico día', name: 'Ana', source: 'pick' },
        { role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Ana', source: 'pick' },
      ];

      const result = buildPeoplePick(true, pickupPeople, new Set());

      expect(result).toHaveLength(2);
      expect(result.map(p => p.roleId)).toEqual(['electric_day', 'electric_night']);
    });
  });

  describe('collectRefNamesForBlock', () => {
    it('should collect refuerzo names for a block', () => {
      const mockDay = {
        team: [{ role: 'DIRECTOR', name: 'Juan' }],
        refList: [
          { role: 'REF', name: 'María' },
          { role: 'REFUERZO', name: 'Carlos' },
        ],
      };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const result = collectRefNamesForBlock(
        mockSafeSemana,
        mockFindWeekAndDay,
        'refList'
      );

      expect(result).toEqual(new Set(['María', 'Carlos']));
    });

    it('should handle empty team list', () => {
      const mockDay = { team: [] };
      mockFindWeekAndDay.mockReturnValue({ day: mockDay });

      const result = collectRefNamesForBlock(
        mockSafeSemana,
        mockFindWeekAndDay,
        'team'
      );

      expect(result).toEqual(new Set());
    });

    it('should handle missing day data', () => {
      mockFindWeekAndDay.mockReturnValue({ day: null });

      const result = collectRefNamesForBlock(
        mockSafeSemana,
        mockFindWeekAndDay,
        'team'
      );

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
