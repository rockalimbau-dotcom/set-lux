import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  usePlanWeeks,
  stripPR,
  isMemberRefuerzo,
  buildRefuerzoIndex,
  weekISOdays,
  weekAllPeopleActive,
} from './plan.ts';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('nomina/utils/plan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('usePlanWeeks', () => {
    it('returns empty arrays when no data in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePlanWeeks({ id: 'test' }));

      expect(result.current).toEqual({ pre: [], pro: [] });
    });

    it('returns data from localStorage', () => {
      const mockData = {
        pre: [{ id: 'pre1', name: 'Pre-production 1' }],
        pro: [{ id: 'pro1', name: 'Production 1' }],
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const { result } = renderHook(() => usePlanWeeks({ id: 'test' }));

      expect(result.current).toEqual(mockData);
    });

    it('uses project id for storage key', () => {
      const { result } = renderHook(() => usePlanWeeks({ id: 'test-project' }));

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'plan_test-project'
      );
    });

    it('uses project nombre when id is not available', () => {
      const { result } = renderHook(() =>
        usePlanWeeks({ nombre: 'test-project-name' })
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'plan_test-project-name'
      );
    });

    it('uses demo as fallback when no id or nombre', () => {
      const { result } = renderHook(() => usePlanWeeks({}));

      expect(localStorageMock.getItem).toHaveBeenCalledWith('plan_demo');
    });

    it('handles invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => usePlanWeeks({ id: 'test' }));

      expect(result.current).toEqual({ pre: [], pro: [] });
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => usePlanWeeks({ id: 'test' }));

      expect(result.current).toEqual({ pre: [], pro: [] });
    });

    it('handles non-array data gracefully', () => {
      const mockData = { pre: 'not-array', pro: 'not-array' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const { result } = renderHook(() => usePlanWeeks({ id: 'test' }));

      expect(result.current).toEqual({ pre: [], pro: [] });
    });

    it('handles null project', () => {
      const { result } = renderHook(() => usePlanWeeks(null));

      expect(localStorageMock.getItem).toHaveBeenCalledWith('plan_demo');
    });

    it('updates when project changes', () => {
      const { result, rerender } = renderHook(
        ({ project }) => usePlanWeeks(project),
        { initialProps: { project: { id: 'project1' } } }
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith('plan_project1');

      rerender({ project: { id: 'project2' } });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('plan_project2');
    });
  });

  describe('stripPR', () => {
    it('removes P suffix', () => {
      expect(stripPR('GP')).toBe('G');
      expect(stripPR('EP')).toBe('E');
      expect(stripPR('BBP')).toBe('BB');
    });

    it('removes R suffix', () => {
      expect(stripPR('GR')).toBe('G');
      expect(stripPR('ER')).toBe('E');
      expect(stripPR('BBR')).toBe('BB');
    });

    it('keeps roles without PR suffix', () => {
      expect(stripPR('G')).toBe('G');
      expect(stripPR('E')).toBe('E');
      expect(stripPR('BB')).toBe('BB');
      expect(stripPR('REF')).toBe('REF');
    });

    it('handles empty string', () => {
      expect(stripPR('')).toBe('');
    });

    it('handles null and undefined', () => {
      expect(stripPR(null)).toBe('');
      expect(stripPR(undefined)).toBe('');
    });

    it('handles multiple PR suffixes', () => {
      expect(stripPR('GPR')).toBe('GP'); // only removes last P or R
      expect(stripPR('EPP')).toBe('EP'); // only removes last P or R
    });

    it('handles non-string input', () => {
      expect(stripPR(123)).toBe('123');
      expect(stripPR({})).toBe('[object Object]');
    });
  });

  describe('isMemberRefuerzo', () => {
    it('returns true for refuerzo flag', () => {
      expect(isMemberRefuerzo({ refuerzo: true })).toBe(true);
    });

    it('returns false for non-refuerzo flag', () => {
      expect(isMemberRefuerzo({ refuerzo: false })).toBe(false);
    });

    it('returns true for role containing ref', () => {
      expect(isMemberRefuerzo({ role: 'REF' })).toBe(true);
      expect(isMemberRefuerzo({ role: 'ref' })).toBe(true);
      expect(isMemberRefuerzo({ role: 'Refuerzo' })).toBe(true);
    });

    it('returns true for name containing ref', () => {
      expect(isMemberRefuerzo({ name: 'REF' })).toBe(true);
      expect(isMemberRefuerzo({ name: 'ref' })).toBe(true);
      expect(isMemberRefuerzo({ name: 'Refuerzo' })).toBe(true);
    });

    it('returns false for normal roles and names', () => {
      expect(isMemberRefuerzo({ role: 'G', name: 'John' })).toBe(false);
      expect(isMemberRefuerzo({ role: 'E', name: 'Jane' })).toBe(false);
    });

    it('handles null and undefined', () => {
      expect(isMemberRefuerzo(null)).toBe(false);
      expect(isMemberRefuerzo(undefined)).toBe(false);
    });

    it('handles empty strings', () => {
      expect(isMemberRefuerzo({ role: '', name: '' })).toBe(false);
    });

    it('handles missing properties', () => {
      expect(isMemberRefuerzo({})).toBe(false);
      expect(isMemberRefuerzo({ role: 'G' })).toBe(false);
      expect(isMemberRefuerzo({ name: 'John' })).toBe(false);
    });
  });

  describe('buildRefuerzoIndex', () => {
    it('builds index from weeks data', () => {
      const weeks = [
        {
          days: [
            {
              team: [
                { role: 'G', name: 'John', refuerzo: true },
                { role: 'E', name: 'Jane' },
              ],
              prelight: [{ role: 'REF', name: 'Bob' }],
              pickup: [{ role: 'G', name: 'Alice', refuerzo: true }],
            },
          ],
        },
      ];

      const result = buildRefuerzoIndex(weeks);

      expect(result).toBeInstanceOf(Set);
      expect(result.has('G__John')).toBe(true);
      expect(result.has('REF__Bob')).toBe(true);
      expect(result.has('G__Alice')).toBe(true);
      expect(result.has('E__Jane')).toBe(false);
    });

    it('handles empty weeks', () => {
      const result = buildRefuerzoIndex([]);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('handles null weeks', () => {
      const result = buildRefuerzoIndex(null);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('handles weeks with no days', () => {
      const weeks = [{ days: [] }];
      const result = buildRefuerzoIndex(weeks);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('handles days with no team/prelight/pickup', () => {
      const weeks = [{ days: [{ team: [], prelight: [], pickup: [] }] }];
      const result = buildRefuerzoIndex(weeks);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('handles missing team/prelight/pickup arrays', () => {
      const weeks = [{ days: [{}] }];
      const result = buildRefuerzoIndex(weeks);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('handles null team members', () => {
      const weeks = [
        {
          days: [
            {
              team: [null, { role: 'G', name: 'John', refuerzo: true }],
            },
          ],
        },
      ];

      const result = buildRefuerzoIndex(weeks);
      expect(result.has('G__John')).toBe(true);
    });
  });

  describe('weekISOdays', () => {
    it('generates 7 days from start date', () => {
      const week = { startDate: '2023-01-01' };
      const result = weekISOdays(week);

      expect(result).toHaveLength(7);
      expect(result[0]).toBe('2023-01-01');
      expect(result[1]).toBe('2023-01-02');
      expect(result[2]).toBe('2023-01-03');
      expect(result[3]).toBe('2023-01-04');
      expect(result[4]).toBe('2023-01-05');
      expect(result[5]).toBe('2023-01-06');
      expect(result[6]).toBe('2023-01-07');
    });

    it('handles month boundaries', () => {
      const week = { startDate: '2023-01-30' };
      const result = weekISOdays(week);

      expect(result).toHaveLength(7);
      expect(result[0]).toBe('2023-01-30');
      expect(result[1]).toBe('2023-01-31');
      expect(result[2]).toBe('2023-02-01');
      expect(result[3]).toBe('2023-02-02');
      expect(result[4]).toBe('2023-02-03');
      expect(result[5]).toBe('2023-02-04');
      expect(result[6]).toBe('2023-02-05');
    });

    it('handles year boundaries', () => {
      const week = { startDate: '2023-12-30' };
      const result = weekISOdays(week);

      expect(result).toHaveLength(7);
      expect(result[0]).toBe('2023-12-30');
      expect(result[1]).toBe('2023-12-31');
      expect(result[2]).toBe('2024-01-01');
      expect(result[3]).toBe('2024-01-02');
      expect(result[4]).toBe('2024-01-03');
      expect(result[5]).toBe('2024-01-04');
      expect(result[6]).toBe('2024-01-05');
    });

    it('handles leap year', () => {
      const week = { startDate: '2024-02-28' };
      const result = weekISOdays(week);

      expect(result).toHaveLength(7);
      expect(result[0]).toBe('2024-02-28');
      expect(result[1]).toBe('2024-02-29');
      expect(result[2]).toBe('2024-03-01');
    });
  });

  describe('weekAllPeopleActive', () => {
    it('collects all people from team, prelight, and pickup', () => {
      const week = {
        days: [
          {
            team: [
              { role: 'G', name: 'John' },
              { role: 'E', name: 'Jane' },
            ],
            prelight: [{ role: 'G', name: 'Bob' }],
            pickup: [{ role: 'E', name: 'Alice' }],
          },
        ],
      };

      const result = weekAllPeopleActive(week);

      expect(result).toHaveLength(4);
      expect(result).toContainEqual({ role: 'G', name: 'John' });
      expect(result).toContainEqual({ role: 'E', name: 'Jane' });
      expect(result).toContainEqual({ role: 'G', name: 'Bob' });
      expect(result).toContainEqual({ role: 'E', name: 'Alice' });
    });

    it('removes duplicates', () => {
      const week = {
        days: [
          {
            team: [{ role: 'G', name: 'John' }],
            prelight: [{ role: 'G', name: 'John' }],
            pickup: [{ role: 'G', name: 'John' }],
          },
        ],
      };

      const result = weekAllPeopleActive(week);

      expect(result).toHaveLength(1); // team, prelight, pickup are merged
      expect(result).toContainEqual({ role: 'G', name: 'John' });
    });

    it('handles empty week', () => {
      const week = { days: [] };
      const result = weekAllPeopleActive(week);
      expect(result).toEqual([]);
    });

    it('handles null week', () => {
      const result = weekAllPeopleActive(null);
      expect(result).toEqual([]);
    });

    it('handles days with no team/prelight/pickup', () => {
      const week = { days: [{ team: [], prelight: [], pickup: [] }] };
      const result = weekAllPeopleActive(week);
      expect(result).toEqual([]);
    });

    it('handles missing team/prelight/pickup arrays', () => {
      const week = { days: [{}] };
      const result = weekAllPeopleActive(week);
      expect(result).toEqual([]);
    });

    it('handles null team members', () => {
      const week = {
        days: [
          {
            team: [{ role: 'G', name: 'John' }],
            prelight: [],
            pickup: [],
          },
        ],
      };

      const result = weekAllPeopleActive(week);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ role: 'G', name: 'John' });
    });

    it('handles missing role or name', () => {
      const week = {
        days: [
          {
            team: [
              { role: 'G' }, // missing name
              { name: 'John' }, // missing role
              { role: 'E', name: 'Jane' },
            ],
          },
        ],
      };

      const result = weekAllPeopleActive(week);
      expect(result).toHaveLength(3); // all members are included, even with missing properties
      expect(result).toContainEqual({ role: 'G', name: 'Persona_G' }); // Missing name generates default
      expect(result).toContainEqual({ role: '', name: 'John' }); // Missing role uses empty string
      expect(result).toContainEqual({ role: 'E', name: 'Jane' });
    });

    it('handles empty role and name', () => {
      const week = {
        days: [
          {
            team: [
              { role: '', name: '' },
              { role: 'G', name: 'John' },
            ],
          },
        ],
      };

      const result = weekAllPeopleActive(week);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ role: 'G', name: 'John' });
    });

    it('handles multiple days', () => {
      const week = {
        days: [
          {
            team: [{ role: 'G', name: 'John' }],
            prelight: [],
            pickup: [],
          },
          {
            team: [{ role: 'E', name: 'Jane' }],
            prelight: [],
            pickup: [],
          },
        ],
      };

      const result = weekAllPeopleActive(week);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ role: 'G', name: 'John' });
      expect(result).toContainEqual({ role: 'E', name: 'Jane' });
    });
  });
});
