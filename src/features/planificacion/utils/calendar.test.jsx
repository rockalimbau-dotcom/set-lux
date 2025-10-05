import { describe, it, expect, vi, beforeEach } from 'vitest';

import { relabelWeekByCalendar } from './calendar.ts';

// Mock shared utils
vi.mock('../../../shared/utils/date', () => ({
  pad2: vi.fn(n => String(n).padStart(2, '0')),
  toYYYYMMDD: vi.fn(date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
  parseYYYYMMDD: vi.fn(str => new Date(str)),
  addDays: vi.fn((date, days) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  }),
}));

// Mock constants
vi.mock('../constants', () => ({
  mdKey: vi.fn(
    (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  ),
}));

describe('planificacion/utils/calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('relabelWeekByCalendar', () => {
    it('relabels week with correct start date', async () => {
      const week = {
        id: 'test-week',
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.startDate).toBe(mondayDateStr);
      expect(result.id).toBe('test-week');
      expect(result.days).toHaveLength(2);
    });

    it('sets weekend days as Descanso', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
          { tipo: 'Rodaje', team: [{ role: 'BB', name: 'Bob' }] },
          { tipo: 'Rodaje', team: [{ role: 'REF', name: 'Alice' }] },
          { tipo: 'Rodaje', team: [{ role: 'REF', name: 'Charlie' }] },
          { team: [{ role: 'REF', name: 'David' }] }, // No tipo for weekend
          { team: [{ role: 'REF', name: 'Eve' }] }, // No tipo for weekend
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      // Saturday (index 5) and Sunday (index 6) should be Descanso
      expect(result.days[5].tipo).toBe('Descanso');
      expect(result.days[5].team).toEqual([]);
      expect(result.days[5].loc).toBe('DESCANSO');
      expect(result.days[6].tipo).toBe('Descanso');
      expect(result.days[6].team).toEqual([]);
      expect(result.days[6].loc).toBe('DESCANSO');
    });

    it('sets holidays as Rodaje Festivo', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set(['2023-01-02']); // Monday is holiday
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[0].tipo).toBe('Rodaje Festivo');
    });

    it('sets holidays using MD format', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set(['01-02']); // January 2nd

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[0].tipo).toBe('Rodaje Festivo');
    });

    it('sets holidays using DD-MM format', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set(['02-01']); // 2nd January

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[0].tipo).toBe('Rodaje Festivo');
    });

    it('preserves existing Descanso type for weekends', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
          { tipo: 'Rodaje', team: [{ role: 'BB', name: 'Bob' }] },
          { tipo: 'Rodaje', team: [{ role: 'REF', name: 'Alice' }] },
          { tipo: 'Rodaje', team: [{ role: 'REF', name: 'Charlie' }] },
          { tipo: 'Descanso', team: [{ role: 'REF', name: 'David' }] },
          { tipo: 'Descanso', team: [{ role: 'REF', name: 'Eve' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[5].tipo).toBe('Descanso');
      expect(result.days[6].tipo).toBe('Descanso');
    });

    it('changes Rodaje to Rodaje Festivo for holidays', async () => {
      const week = {
        days: [
          { tipo: 'Rodaje', team: [{ role: 'G', name: 'John' }] },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set(['2023-01-02']);
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[0].tipo).toBe('Rodaje Festivo');
    });

    it('clears DESCANSO location for non-weekend days', async () => {
      const week = {
        days: [
          {
            tipo: 'Rodaje',
            team: [{ role: 'G', name: 'John' }],
            loc: 'DESCANSO',
          },
          { tipo: 'Rodaje', team: [{ role: 'E', name: 'Jane' }] },
        ],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days[0].loc).toBe('');
    });

    it('handles empty days array', async () => {
      const week = {
        days: [],
      };

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days).toEqual([]);
    });

    it('handles undefined days', async () => {
      const week = {};

      const mondayDateStr = '2023-01-02';
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { parseYYYYMMDD, addDays, toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { mdKey } = await import('../constants');

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockImplementation((date, days) => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      });
      toYYYYMMDD.mockImplementation(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
      mdKey.mockImplementation(
        (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      );

      const result = relabelWeekByCalendar(
        week,
        mondayDateStr,
        holidayFull,
        holidayMD
      );

      expect(result.days).toEqual([]);
    });
  });
});
