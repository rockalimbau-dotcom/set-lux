import { describe, it, expect } from 'vitest';

import {
  sortByHierarchy,
  indexRoster,
  positionsOfRole,
  syncDayListWithRoster,
  syncDayListWithRosterBlankOnly,
  syncAllWeeks,
} from './sync.ts';

describe('planificacion/utils/sync', () => {
  describe('sortByHierarchy', () => {
    it('sorts team members by role hierarchy', () => {
      const members = [
        { role: 'REF', name: 'Alice' },
        { role: 'BB', name: 'Bob' },
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
        { role: 'REF', name: 'Charlie' },
      ];

      const result = sortByHierarchy(members);

      expect(result[0].role).toBe('G');
      expect(result[1].role).toBe('BB');
      expect(result[2].role).toBe('E');
      expect(result[3].role).toBe('REF');
      expect(result[4].role).toBe('REF');
    });

    it('maintains original order for same priority roles', () => {
      const members = [
        { role: 'E', name: 'Jane' },
        { role: 'E', name: 'Bob' },
        { role: 'E', name: 'Alice' },
      ];

      const result = sortByHierarchy(members);

      expect(result[0].name).toBe('Jane');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('handles empty array', () => {
      const result = sortByHierarchy([]);
      expect(result).toEqual([]);
    });

    it('handles undefined/null roles', () => {
      const members = [
        { role: 'G', name: 'John' },
        { role: null, name: 'Null' },
        { role: undefined, name: 'Undefined' },
        { role: '', name: 'Empty' },
      ];

      const result = sortByHierarchy(members);

      expect(result[0].role).toBe('G');
      expect(result[1].role).toBe(null);
      expect(result[2].role).toBe(undefined);
      expect(result[3].role).toBe('');
    });

    it('handles case insensitive role comparison', () => {
      const members = [
        { role: 'g', name: 'John' },
        { role: 'G', name: 'Jane' },
        { role: 'bb', name: 'Bob' },
      ];

      const result = sortByHierarchy(members);

      expect(result[0].role).toBe('g');
      expect(result[1].role).toBe('G');
      expect(result[2].role).toBe('bb');
    });

    it('sorts complete role hierarchy correctly', () => {
      const members = [
        { role: 'MR', name: 'Maquinista Recogida' },
        { role: 'REF', name: 'Refuerzo' },
        { role: 'GP', name: 'Gaffer Prelight' },
        { role: 'E', name: 'Eléctrico' },
        { role: 'G', name: 'Gaffer' },
        { role: 'BB', name: 'Best Boy' },
        { role: 'GR', name: 'Gaffer Recogida' },
        { role: 'TM', name: 'Técnico' },
        { role: 'EP', name: 'Eléctrico Prelight' },
      ];

      const result = sortByHierarchy(members);

      // Verificar orden: EQUIPO BASE → REFUERZOS → EQUIPO PRELIGHT → EQUIPO RECOGIDA
      expect(result[0].role).toBe('G'); // EQUIPO BASE
      expect(result[1].role).toBe('BB'); // EQUIPO BASE
      expect(result[2].role).toBe('E'); // EQUIPO BASE
      expect(result[3].role).toBe('TM'); // EQUIPO BASE
      expect(result[4].role).toBe('REF'); // REFUERZOS
      expect(result[5].role).toBe('GP'); // EQUIPO PRELIGHT
      expect(result[6].role).toBe('EP'); // EQUIPO PRELIGHT
      expect(result[7].role).toBe('GR'); // EQUIPO RECOGIDA
      expect(result[8].role).toBe('MR'); // EQUIPO RECOGIDA
    });
  });

  describe('indexRoster', () => {
    it('creates index of names by role', () => {
      const members = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
        { role: 'G', name: 'Bob' },
        { role: 'E', name: 'Alice' },
      ];

      const result = indexRoster(members);

      expect(result.get('G')).toEqual(['John', 'Bob']);
      expect(result.get('E')).toEqual(['Jane', 'Alice']);
    });

    it('handles empty array', () => {
      const result = indexRoster([]);
      expect(result.size).toBe(0);
    });

    it('handles members without role', () => {
      const members = [
        { role: 'G', name: 'John' },
        { name: 'NoRole' },
        { role: null, name: 'NullRole' },
        { role: '', name: 'EmptyRole' },
      ];

      const result = indexRoster(members);

      expect(result.get('G')).toEqual(['John']);
      expect(result.size).toBe(1);
    });

    it('handles members without name', () => {
      const members = [
        { role: 'G', name: 'John' },
        { role: 'E', name: null },
        { role: 'BB', name: undefined },
        { role: 'REF', name: '' },
      ];

      const result = indexRoster(members);

      expect(result.get('G')).toEqual(['John']);
      expect(result.get('E')).toEqual(['']);
      expect(result.get('BB')).toEqual(['']);
      expect(result.get('REF')).toEqual(['']);
    });
  });

  describe('positionsOfRole', () => {
    it('finds positions of specific role', () => {
      const members = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
        { role: 'G', name: 'Bob' },
        { role: 'E', name: 'Alice' },
      ];

      const result = positionsOfRole(members, 'G');

      expect(result).toEqual([0, 2]);
    });

    it('returns empty array when role not found', () => {
      const members = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
      ];

      const result = positionsOfRole(members, 'BB');

      expect(result).toEqual([]);
    });

    it('handles empty array', () => {
      const result = positionsOfRole([], 'G');
      expect(result).toEqual([]);
    });

    it('handles null/undefined members', () => {
      const members = [
        { role: 'G', name: 'John' },
        null,
        { role: 'G', name: 'Bob' },
        undefined,
      ];

      const result = positionsOfRole(members, 'G');

      expect(result).toEqual([0, 2]);
    });
  });

  describe('syncDayListWithRoster', () => {
    it('syncs day list with roster names', () => {
      const dayList = [
        { role: 'G', name: 'Old John' },
        { role: 'E', name: 'Old Jane' },
        { role: 'BB', name: 'Old Bob' },
      ];

      const rosterList = [
        { role: 'G', name: 'New John' },
        { role: 'E', name: 'New Jane' },
        { role: 'BB', name: 'New Bob' },
      ];

      const result = syncDayListWithRoster(dayList, rosterList);

      expect(result[0].name).toBe('New John');
      expect(result[1].name).toBe('New Jane');
      expect(result[2].name).toBe('New Bob');
      expect(result[0].source).toBe('base');
      expect(result[1].source).toBe('base');
      expect(result[2].source).toBe('base');
    });

    it('adds missing roles from roster', () => {
      const dayList = [{ role: 'G', name: 'John' }];

      const rosterList = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
        { role: 'BB', name: 'Bob' },
      ];

      const result = syncDayListWithRoster(dayList, rosterList);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
      expect(result[2].name).toBe('Bob');
      expect(result[1].source).toBe('base');
      expect(result[2].source).toBe('base');
    });

    it('handles empty day list', () => {
      const dayList = [];
      const rosterList = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
      ];

      const result = syncDayListWithRoster(dayList, rosterList);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
    });

    it('handles non-array day list', () => {
      const dayList = null;
      const rosterList = [{ role: 'G', name: 'John' }];

      const result = syncDayListWithRoster(dayList, rosterList);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });
  });

  describe('syncDayListWithRosterBlankOnly', () => {
    it('only updates blank names', () => {
      const dayList = [
        { role: 'G', name: 'John' },
        { role: 'E', name: '' },
        { role: 'BB', name: 'Bob' },
      ];

      const rosterList = [
        { role: 'G', name: 'New John' },
        { role: 'E', name: 'Jane' },
        { role: 'BB', name: 'New Bob' },
      ];

      const result = syncDayListWithRosterBlankOnly(
        dayList,
        rosterList,
        'fallback'
      );

      expect(result[0].name).toBe('John'); // Not updated
      expect(result[1].name).toBe('Jane'); // Updated from blank
      expect(result[2].name).toBe('Bob'); // Not updated
      expect(result[1].source).toBe('fallback');
    });

    it('handles whitespace-only names as blank', () => {
      const dayList = [
        { role: 'G', name: '   ' },
        { role: 'E', name: 'Jane' },
      ];

      const rosterList = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'New Jane' },
      ];

      const result = syncDayListWithRosterBlankOnly(
        dayList,
        rosterList,
        'fallback'
      );

      expect(result[0].name).toBe('John'); // Updated from whitespace
      expect(result[1].name).toBe('Jane'); // Not updated
    });

    it('respects length limits', () => {
      const dayList = [
        { role: 'G', name: '' },
        { role: 'E', name: '' },
        { role: 'BB', name: '' },
      ];

      const rosterList = [
        { role: 'G', name: 'John' },
        { role: 'E', name: 'Jane' },
      ];

      const result = syncDayListWithRosterBlankOnly(
        dayList,
        rosterList,
        'fallback'
      );

      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
      expect(result[2].name).toBe(''); // Not updated due to length limit
    });
  });

  describe('syncAllWeeks', () => {
    it('syncs all weeks with rosters', () => {
      const weeks = [
        {
          id: 'week1',
          days: [
            {
              tipo: 'Rodaje',
              team: [{ role: 'G', name: '' }],
              prelight: [{ role: 'E', name: '' }],
              pickup: [{ role: 'BB', name: '' }],
            },
          ],
        },
      ];

      const base = [{ role: 'G', name: 'New John' }];
      const pre = [{ role: 'E', name: 'Jane' }];
      const pick = [{ role: 'BB', name: 'New Bob' }];
      const refs = [{ role: 'REF', name: 'Alice' }];

      const result = syncAllWeeks(weeks, base, pre, pick, refs);

      expect(result[0].days[0].team[0].name).toBe('New John');
      expect(result[0].days[0].prelight[0].name).toBe('Jane');
      expect(result[0].days[0].pickup[0].name).toBe('New Bob');
    });

    it('handles Descanso days', () => {
      const weeks = [
        {
          id: 'week1',
          days: [
            {
              tipo: 'Descanso',
              team: [{ role: 'G', name: 'John' }],
              prelight: [{ role: 'E', name: 'Jane' }],
              pickup: [{ role: 'BB', name: 'Bob' }],
            },
          ],
        },
      ];

      const base = [{ role: 'G', name: 'New John' }];
      const pre = [{ role: 'E', name: 'New Jane' }];
      const pick = [{ role: 'BB', name: 'New Bob' }];
      const refs = [];

      const result = syncAllWeeks(weeks, base, pre, pick, refs);

      expect(result[0].days[0].team).toEqual([]);
      expect(result[0].days[0].prelight).toEqual([]);
      expect(result[0].days[0].pickup).toEqual([]);
      expect(result[0].days[0].loc).toBe('DESCANSO');
      expect(result[0].days[0].start).toBe('');
      expect(result[0].days[0].end).toBe('');
    });

    it('handles empty team arrays', () => {
      const weeks = [
        {
          id: 'week1',
          days: [
            {
              tipo: 'Rodaje',
              team: [],
            },
          ],
        },
      ];

      const base = [{ role: 'G', name: 'John' }];
      const pre = [{ role: 'E', name: 'Jane' }];
      const pick = [{ role: 'BB', name: 'Bob' }];
      const refs = [];

      const result = syncAllWeeks(weeks, base, pre, pick, refs);

      expect(result[0].days[0].team[0].name).toBe('John');
      expect(result[0].days[0].team[0].source).toBe('base');
    });

    it('handles undefined team arrays', () => {
      const weeks = [
        {
          id: 'week1',
          days: [
            {
              tipo: 'Rodaje',
            },
          ],
        },
      ];

      const base = [{ role: 'G', name: 'John' }];
      const pre = [{ role: 'E', name: 'Jane' }];
      const pick = [{ role: 'BB', name: 'Bob' }];
      const refs = [];

      const result = syncAllWeeks(weeks, base, pre, pick, refs);

      expect(result[0].days[0].team[0].name).toBe('John');
      expect(result[0].days[0].team[0].source).toBe('base');
    });

    it('syncs refuerzos correctly', () => {
      const weeks = [
        {
          id: 'week1',
          days: [
            {
              tipo: 'Rodaje',
              team: [{ role: 'REF', name: '' }],
              prelight: [{ role: 'REF', name: 'Old Alice' }],
              pickup: [{ role: 'REF', name: '' }],
            },
          ],
        },
      ];

      const base = [];
      const pre = [];
      const pick = [];
      const refs = [{ role: 'REF', name: 'Alice' }];

      const result = syncAllWeeks(weeks, base, pre, pick, refs);

      expect(result[0].days[0].team[0].name).toBe('Alice');
      expect(result[0].days[0].prelight[0].name).toBe('Old Alice'); // Not updated
      expect(result[0].days[0].pickup[0].name).toBe('Alice');
    });

    it('handles empty weeks array', () => {
      const result = syncAllWeeks([], [], [], [], []);
      expect(result).toEqual([]);
    });

    it('handles undefined weeks', () => {
      const result = syncAllWeeks(null, [], [], [], []);
      expect(result).toEqual([]);
    });
  });
});
