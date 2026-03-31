import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  nextStartForPro,
  nextStartForPre,
  addPreWeekAction,
  addProWeekAction,
  duplicateWeekAction,
  rebaseWeeksAround,
} from './weekActions.ts';

// Mock shared utils
vi.mock('../../../shared/utils/date', () => ({
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

// Mock other utils
vi.mock('./calendar', () => ({
  relabelWeekByCalendar: vi.fn((week, startDate) => ({
    ...week,
    startDate,
  })),
}));

vi.mock('./weeks', () => ({
  createWeek: vi.fn((label, startDate) => ({
    id: 'new-week-id',
    label,
    startDate,
    days: [],
  })),
}));

describe('planificacion/utils/weekActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('nextStartForPro', () => {
    it('returns next Monday after last pro week', async () => {
      const preWeeks = [];
      const proWeeks = [
        { id: 'week1', startDate: '2023-01-02' },
        { id: 'week2', startDate: '2023-01-09' },
      ];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-16'));
      toYYYYMMDD.mockReturnValue('2023-01-16');

      const result = nextStartForPro(preWeeks, proWeeks);

      expect(parseYYYYMMDD).toHaveBeenCalledWith('2023-01-09');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), 7);
      expect(result).toBe('2023-01-16');
    });

    it('returns next Monday after last pre week when no pro weeks', async () => {
      const preWeeks = [
        { id: 'pre1', startDate: '2023-01-02' },
        { id: 'pre2', startDate: '2023-01-09' },
      ];
      const proWeeks = [];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-16'));
      toYYYYMMDD.mockReturnValue('2023-01-16');

      const result = nextStartForPro(preWeeks, proWeeks);

      expect(parseYYYYMMDD).toHaveBeenCalledWith('2023-01-09');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), 7);
      expect(result).toBe('2023-01-16');
    });

    it('returns next Monday from today when no weeks exist', async () => {
      const preWeeks = [];
      const proWeeks = [];

      const { toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      toYYYYMMDD.mockReturnValue('2023-01-02');

      const result = nextStartForPro(preWeeks, proWeeks);

      expect(result).toBe('2023-01-02');
    });
  });

  describe('nextStartForPre', () => {
    it('returns Monday before first pre week', async () => {
      const preWeeks = [
        { id: 'pre1', startDate: '2023-01-09' },
        { id: 'pre2', startDate: '2023-01-02' },
      ];
      const proWeeks = [];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-02'));
      addDays.mockReturnValue(new Date('2022-12-26'));
      toYYYYMMDD.mockReturnValue('2022-12-26');

      const result = nextStartForPre(preWeeks, proWeeks);

      expect(parseYYYYMMDD).toHaveBeenCalledWith('2023-01-02');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), -7);
      expect(result).toBe('2022-12-26');
    });

    it('returns Monday before first pro week when no pre weeks', async () => {
      const preWeeks = [];
      const proWeeks = [{ id: 'week1', startDate: '2023-01-09' }];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-02'));
      toYYYYMMDD.mockReturnValue('2023-01-02');

      const result = nextStartForPre(preWeeks, proWeeks);

      expect(parseYYYYMMDD).toHaveBeenCalledWith('2023-01-09');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), -7);
      expect(result).toBe('2023-01-02');
    });

    it('returns Monday before today when no weeks exist', async () => {
      const preWeeks = [];
      const proWeeks = [];

      const { toYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      toYYYYMMDD.mockReturnValue('2022-12-26');

      const result = nextStartForPre(preWeeks, proWeeks);

      expect(result).toBe('2022-12-26');
    });
  });

  describe('addPreWeekAction', () => {
    it('adds new pre week and sorts by date', async () => {
      const preWeeks = [{ id: 'pre1', startDate: '2023-01-09' }];
      const baseRoster = [{ role: 'G', name: 'John' }];
      const preRoster = [{ role: 'E', name: 'Jane' }];
      const pickRoster = [{ role: 'BB', name: 'Bob' }];
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { createWeek } = vi.mocked(await import('./weeks'));

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-02'));
      toYYYYMMDD.mockReturnValue('2023-01-02');
      createWeek.mockReturnValue({
        id: 'new-week-id',
        label: 'Semana -2',
        startDate: '2023-01-02',
        days: [],
      });

      const result = addPreWeekAction(
        preWeeks,
        baseRoster,
        preRoster,
        pickRoster,
        holidayFull,
        holidayMD
      );

      expect(result).toHaveLength(2);
      expect(result[0].startDate).toBe('2023-01-09'); // Original week first
      expect(result[1].startDate).toBe('2023-01-02'); // New week second
      expect(createWeek).toHaveBeenCalledWith(
        'Semana -2',
        '2023-01-02',
        baseRoster,
        preRoster,
        pickRoster,
        holidayFull,
        holidayMD
      );
    });
  });

  describe('addProWeekAction', () => {
    it('adds new pro week', async () => {
      const preWeeks = [{ id: 'pre1', startDate: '2023-01-02' }];
      const proWeeks = [{ id: 'week1', startDate: '2023-01-09' }];
      const baseRoster = [{ role: 'G', name: 'John' }];
      const preRoster = [{ role: 'E', name: 'Jane' }];
      const pickRoster = [{ role: 'BB', name: 'Bob' }];
      const holidayFull = new Set();
      const holidayMD = new Set();

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { createWeek } = vi.mocked(await import('./weeks'));

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-16'));
      toYYYYMMDD.mockReturnValue('2023-01-16');
      createWeek.mockReturnValue({
        id: 'new-week-id',
        label: 'Semana 2',
        startDate: '2023-01-16',
        days: [],
      });

      const result = addProWeekAction(
        preWeeks,
        proWeeks,
        baseRoster,
        preRoster,
        pickRoster,
        holidayFull,
        holidayMD
      );

      expect(result).toHaveLength(2);
      expect(result[1].startDate).toBe('2023-01-16');
      expect(createWeek).toHaveBeenCalledWith(
        'Semana 2',
        '2023-01-16',
        baseRoster,
        preRoster,
        pickRoster,
        holidayFull,
        holidayMD
      );
    });
  });

  describe('duplicateWeekAction', () => {
    it('duplicates week with new ID and date', async () => {
      const weeks = [
        { id: 'week1', label: 'Semana 1', startDate: '2023-01-09' },
        { id: 'week2', label: 'Semana 2', startDate: '2023-01-16' },
      ];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-23'));
      toYYYYMMDD.mockReturnValue('2023-01-23');

      // Mock crypto.randomUUID
      const mockUUID = 'new-uuid-123';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => mockUUID),
      });

      const result = duplicateWeekAction(weeks, 'week1', 1);

      expect(result).toHaveLength(3);
      expect(result[2].id).toBe(mockUUID);
      expect(result[2].label).toBe('Semana 3');
      expect(result[2].startDate).toBe('2023-01-23');
      expect(parseYYYYMMDD).toHaveBeenCalledWith('2023-01-09');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), 7);
    });

    it('uses custom label function', async () => {
      const weeks = [
        { id: 'week1', label: 'Semana 1', startDate: '2023-01-09' },
      ];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-16'));
      toYYYYMMDD.mockReturnValue('2023-01-16');

      const mockUUID = 'new-uuid-123';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => mockUUID),
      });

      const makeLabel = count => `Custom Week ${count}`;
      const result = duplicateWeekAction(weeks, 'week1', 1, makeLabel);

      expect(result[1].label).toBe('Custom Week 2');
    });

    it('returns original weeks when week not found', () => {
      const weeks = [
        { id: 'week1', label: 'Semana 1', startDate: '2023-01-09' },
      ];

      const result = duplicateWeekAction(weeks, 'nonexistent', 1);

      expect(result).toEqual(weeks);
    });

    it('handles negative direction', async () => {
      const weeks = [
        { id: 'week1', label: 'Semana 1', startDate: '2023-01-09' },
      ];

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );

      parseYYYYMMDD.mockReturnValue(new Date('2023-01-09'));
      addDays.mockReturnValue(new Date('2023-01-02'));
      toYYYYMMDD.mockReturnValue('2023-01-02');

      const mockUUID = 'new-uuid-123';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => mockUUID),
      });

      const result = duplicateWeekAction(weeks, 'week1', -1);

      expect(result[1].startDate).toBe('2023-01-02');
      expect(addDays).toHaveBeenCalledWith(expect.any(Date), -7);
    });
  });

  describe('rebaseWeeksAround', () => {
    it('rebase weeks around anchor week', async () => {
      const preWeeks = [
        { id: 'pre1', startDate: '2023-01-02' },
        { id: 'pre2', startDate: '2023-01-09' },
      ];
      const proWeeks = [
        { id: 'week1', startDate: '2023-01-16' },
        { id: 'week2', startDate: '2023-01-23' },
      ];
      const weekId = 'week1';
      const monday = new Date('2023-02-06'); // New anchor date

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { relabelWeekByCalendar } = vi.mocked(await import('./calendar'));

      parseYYYYMMDD.mockImplementation(str => new Date(str));
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

      relabelWeekByCalendar.mockImplementation((week, startDate) => ({
        ...week,
        startDate,
      }));

      const holidayFull = new Set();
      const holidayMD = new Set();

      const result = rebaseWeeksAround(
        preWeeks,
        proWeeks,
        weekId,
        monday,
        holidayFull,
        holidayMD
      );

      expect(result.pre).toHaveLength(2);
      expect(result.pro).toHaveLength(2);
      expect(relabelWeekByCalendar).toHaveBeenCalledTimes(4);
    });

    it('returns original weeks when anchor not found', () => {
      const preWeeks = [{ id: 'pre1', startDate: '2023-01-02' }];
      const proWeeks = [{ id: 'week1', startDate: '2023-01-09' }];
      const weekId = 'nonexistent';
      const monday = new Date('2023-02-06');

      const result = rebaseWeeksAround(
        preWeeks,
        proWeeks,
        weekId,
        monday,
        new Set(),
        new Set()
      );

      expect(result.pre).toEqual(preWeeks);
      expect(result.pro).toEqual(proWeeks);
    });

    it('sorts weeks by date after rebasing', async () => {
      const preWeeks = [
        { id: 'pre1', startDate: '2023-01-09' },
        { id: 'pre2', startDate: '2023-01-02' },
      ];
      const proWeeks = [{ id: 'week1', startDate: '2023-01-16' }];
      const weekId = 'week1';
      const monday = new Date('2023-02-06');

      const { toYYYYMMDD, addDays, parseYYYYMMDD } = vi.mocked(
        await import('../../../shared/utils/date')
      );
      const { relabelWeekByCalendar } = vi.mocked(await import('./calendar'));

      parseYYYYMMDD.mockImplementation(str => new Date(str));
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

      relabelWeekByCalendar.mockImplementation((week, startDate) => ({
        ...week,
        startDate,
      }));

      const result = rebaseWeeksAround(
        preWeeks,
        proWeeks,
        weekId,
        monday,
        new Set(),
        new Set()
      );

      // Check that weeks are sorted by date
      const allWeeks = [...result.pre, ...result.pro];
      for (let i = 1; i < allWeeks.length; i++) {
        const prevDate = new Date(allWeeks[i - 1].startDate);
        const currDate = new Date(allWeeks[i].startDate);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    });
  });
});
