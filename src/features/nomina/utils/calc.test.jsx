import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  makeRolePrices,
  aggregateReports,
  getCondParams,
  getOvertimeWindowForPayrollMonth,
  isoInRange,
  aggregateWindowedReport,
} from './calc.ts';

// Mock dependencies
vi.mock('./cond.ts', () => ({
  loadCondModel: vi.fn(),
}));

vi.mock('./date.ts', () => ({
  parseYYYYMMDD: vi.fn(),
}));

vi.mock('./parse.ts', () => ({
  parseNum: vi.fn(),
  parseDietasValue: vi.fn(),
  parseHorasExtra: vi.fn(),
}));

vi.mock('./plan.ts', () => ({
  stripPR: vi.fn(),
  buildRefuerzoIndex: vi.fn(),
  weekISOdays: vi.fn(),
  weekAllPeopleActive: vi.fn(),
}));

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

describe('nomina/utils/calc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('makeRolePrices', () => {
    it('creates role prices function with project data', async () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'semanal',
      };

      const mockModel = {
        prices: {
          G: {
            'Precio jornada': '100',
            'Travel day': '50',
            'Horas extras': '15',
          },
          E: {
            'Precio jornada': '80',
            'Travel day': '40',
            'Horas extras': '12',
          },
        },
        params: {
          divTravel: '2',
          transporteDia: '20',
          kilometrajeKm: '0.5',
          dietaComida: '15',
          dietaCena: '25',
          dietaSinPernocta: '30',
          dietaAlojDes: '50',
          gastosBolsillo: '10',
        },
      };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const { getForRole } = makeRolePrices(mockProject);

      const prices = getForRole('G');
      expect(prices).toEqual({
        jornada: 100,
        travelDay: 50,
        horaExtra: 15,
        holidayDay: 0, // Added holidayDay
        transporte: 20,
        km: 0.5,
        dietas: {
          Comida: 15,
          Cena: 25,
          'Dieta sin pernoctar': 30,
          'Dieta completa + desayuno': 50,
          'Gastos de bolsillo': 10,
        },
      });
    });

    it('handles REF role with base role fallback', async () => {
      const mockProject = { id: 'test' };
      const mockModel = {
        prices: {
          BB: {
            'Precio jornada': '90',
            'Travel day': '45',
            'Horas extras': '14',
          },
          E: {
            'Precio refuerzo': '70',
            'Precio jornada': '80',
            'Horas extras': '12',
          },
        },
        params: { divTravel: '2' },
      };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const { getForRole } = makeRolePrices(mockProject);
      const prices = getForRole('REF', 'BB');

      expect(prices.jornada).toBe(90); // From BB jornada (no refuerzo price)
      expect(prices.travelDay).toBe(45); // From BB travel day
      expect(prices.horaExtra).toBe(12); // From E horas extras
    });

    it('handles missing data gracefully', async () => {
      const mockProject = { id: 'test' };
      const mockModel = { prices: {}, params: {} };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const { getForRole } = makeRolePrices(mockProject);
      const prices = getForRole('UNKNOWN');

      expect(prices.jornada).toBe(0);
      expect(prices.travelDay).toBe(0);
      expect(prices.horaExtra).toBe(0);
      expect(prices.transporte).toBe(0);
      expect(prices.km).toBe(0);
    });

    it('handles role codes with PR suffix', async () => {
      const mockProject = { id: 'test' };
      const mockModel = {
        prices: {
          G: {
            'Precio jornada': '100',
            'Travel day': '50',
            'Horas extras': '15',
          },
        },
        params: { divTravel: '2' },
      };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const { getForRole } = makeRolePrices(mockProject);
      const prices = getForRole('GP');

      expect(prices.jornada).toBe(100);
      expect(prices.travelDay).toBe(50);
    });

    it('calculates travel day from jornada when not specified', async () => {
      const mockProject = { id: 'test' };
      const mockModel = {
        prices: {
          G: { 'Precio jornada': '100', 'Horas extras': '15' },
        },
        params: { divTravel: '2' },
      };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const { getForRole } = makeRolePrices(mockProject);
      const prices = getForRole('G');

      expect(prices.travelDay).toBe(50); // 100 / 2
    });
  });

  describe('aggregateReports', () => {
    it('aggregates reports from weeks data', async () => {
      const mockProject = { id: 'test-project' };
      const mockWeeks = [
        {
          startDate: '2023-01-01',
          days: [
            {
              team: [
                { role: 'G', name: 'John Doe' },
                { role: 'E', name: 'Jane Smith' },
              ],
            },
          ],
        },
      ];

      const mockData = {
        'G__John Doe': {
          'Horas extra': { '2023-01-01': '2' },
          'Turn Around': { '2023-01-01': '1' },
          Nocturnidad: { '2023-01-01': 'SI' },
          Dietas: { '2023-01-01': 'Comida' },
          Kilometraje: { '2023-01-01': '50' },
          Transporte: { '2023-01-01': 'SI' },
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const { weekISOdays, weekAllPeopleActive, buildRefuerzoIndex, stripPR } =
        await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01', '2023-01-02']);
      weekAllPeopleActive.mockReturnValue([
        { role: 'G', name: 'John Doe' },
        { role: 'E', name: 'Jane Smith' },
      ]);
      buildRefuerzoIndex.mockReturnValue(new Set());
      stripPR.mockImplementation(role => role.replace(/[PR]$/, ''));

      const { parseNum, parseDietasValue, parseHorasExtra } = await import('./parse.ts');
      parseNum.mockImplementation(val => Number(val) || 0);
      parseDietasValue.mockReturnValue({ labels: ['Comida'], ticket: 0 });
      parseHorasExtra.mockImplementation(val => Number(val) || 0);

      const result = aggregateReports(mockProject, mockWeeks);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        role: 'G',
        name: 'John Doe',
        extras: 4, // 2 + 1 + 1 (nocturnidad)
        transporte: 1,
        km: 50,
      });
    });

    it('handles empty weeks array', () => {
      const mockProject = { id: 'test' };
      const result = aggregateReports(mockProject, []);
      expect(result).toEqual([]);
    });

    it('filters by ISO dates when filter provided', async () => {
      const mockProject = { id: 'test' };
      const mockWeeks = [{ startDate: '2023-01-01' }];
      const filterISO = iso => iso === '2023-01-01';

      const { weekISOdays, weekAllPeopleActive } = await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01', '2023-01-02']);
      weekAllPeopleActive.mockReturnValue([]);

      const result = aggregateReports(mockProject, mockWeeks, filterISO);
      expect(result).toEqual([]);
    });

    it('handles localStorage errors gracefully', async () => {
      const mockProject = { id: 'test' };
      const mockWeeks = [{ startDate: '2023-01-01' }];

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { weekISOdays, weekAllPeopleActive } = await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01']);
      weekAllPeopleActive.mockReturnValue([]);

      const result = aggregateReports(mockProject, mockWeeks);
      expect(result).toEqual([]);
    });

    it('handles penalty lunch correctly', async () => {
      const mockProject = { id: 'test' };
      const mockWeeks = [{ startDate: '2023-01-01' }];

      const mockData = {
        G__John: {
          'Penalty lunch': { '2023-01-01': 'SI' },
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const { weekISOdays, weekAllPeopleActive, buildRefuerzoIndex, stripPR } =
        await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01']);
      weekAllPeopleActive.mockReturnValue([{ role: 'G', name: 'John' }]);
      buildRefuerzoIndex.mockReturnValue(new Set());
      stripPR.mockImplementation(role => role.replace(/[PR]$/, ''));

      const { parseNum, parseDietasValue, parseHorasExtra } = await import('./parse.ts');
      parseNum.mockReturnValue(0);
      parseDietasValue.mockReturnValue({ labels: [], ticket: 0 });
      parseHorasExtra.mockReturnValue(0);

      const result = aggregateReports(mockProject, mockWeeks);

      expect(result[0].extras).toBe(1); // penalty lunch adds 1
    });
  });

  describe('getCondParams', () => {
    it('returns params from project conditions', async () => {
      const mockProject = { id: 'test' };
      const mockModel = {
        params: {
          divTravel: '2',
          transporteDia: '20',
        },
      };

      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue(mockModel);

      const result = getCondParams(mockProject);
      expect(result).toEqual(mockModel.params);
    });

    it('returns empty object when no model found', async () => {
      const mockProject = { id: 'test' };
      const { loadCondModel } = await import('./cond.ts');
      loadCondModel.mockReturnValue({});

      const result = getCondParams(mockProject);
      expect(result).toEqual({});
    });
  });

  describe('getOvertimeWindowForPayrollMonth', () => {
    it('returns valid date range for valid parameters', () => {
      const monthKey = '2023-01';
      const params = { heCierreIni: '15', heCierreFin: '20' };

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);

      expect(result).toBeDefined();
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
      expect(result.start.getMonth()).toBe(11); // December (M-1-1)
      expect(result.end.getMonth()).toBe(0); // January (M-1)
    });

    it('returns null for invalid day parameters', () => {
      const monthKey = '2023-01';
      const params = { heCierreIni: '32', heCierreFin: '40' };

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);
      expect(result).toBeNull();
    });

    it('returns null for missing parameters', () => {
      const monthKey = '2023-01';
      const params = {};

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);
      expect(result).toBeNull();
    });

    it('returns null for non-integer parameters', () => {
      const monthKey = '2023-01';
      const params = { heCierreIni: 'invalid', heCierreFin: '20' };

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);
      expect(result).toBeNull();
    });

    it('handles edge case day 1', () => {
      const monthKey = '2023-01';
      const params = { heCierreIni: '1', heCierreFin: '1' };

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);
      expect(result).toBeDefined();
    });

    it('handles edge case day 31', () => {
      const monthKey = '2023-01';
      const params = { heCierreIni: '31', heCierreFin: '31' };

      const result = getOvertimeWindowForPayrollMonth(monthKey, params);
      expect(result).toBeDefined();
    });
  });

  describe('isoInRange', () => {
    it('returns true for date within range', async () => {
      const { parseYYYYMMDD } = await import('./date.ts');
      parseYYYYMMDD.mockReturnValue(new Date('2023-01-15'));

      const start = new Date('2023-01-01');
      const end = new Date('2023-01-31');
      const result = isoInRange('2023-01-15', start, end);

      expect(result).toBe(true);
    });

    it('returns false for date outside range', async () => {
      const { parseYYYYMMDD } = await import('./date.ts');
      parseYYYYMMDD.mockReturnValue(new Date('2023-02-01'));

      const start = new Date('2023-01-01');
      const end = new Date('2023-01-31');
      const result = isoInRange('2023-02-01', start, end);

      expect(result).toBe(false);
    });

    it('returns true for date at range boundaries', async () => {
      const { parseYYYYMMDD } = await import('./date.ts');
      parseYYYYMMDD.mockReturnValue(new Date('2023-01-01'));

      const start = new Date('2023-01-01');
      const end = new Date('2023-01-31');
      const result = isoInRange('2023-01-01', start, end);

      expect(result).toBe(true);
    });
  });

  describe('aggregateWindowedReport', () => {
    it('aggregates windowed reports correctly', async () => {
      const mockProject = { id: 'test' };
      const mockWeeks = [{ startDate: '2023-01-01' }];
      const filterISO = iso => iso === '2023-01-01';

      const mockData = {
        G__John: {
          'Horas extra': { '2023-01-01': '2' },
          Dietas: { '2023-01-01': 'Comida' },
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const { weekISOdays, weekAllPeopleActive, stripPR, buildRefuerzoIndex } =
        await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01', '2023-01-02']);
      weekAllPeopleActive.mockReturnValue([{ role: 'G', name: 'John' }]);
      stripPR.mockImplementation(role => role.replace(/[PR]$/, ''));
      buildRefuerzoIndex.mockReturnValue(new Set());

      const { parseNum, parseDietasValue, parseHorasExtra } = await import('./parse.ts');
      parseNum.mockImplementation(val => Number(val) || 0);
      parseDietasValue.mockReturnValue({ labels: ['Comida'], ticket: 0 });
      parseHorasExtra.mockImplementation(val => Number(val) || 0);

      const result = aggregateWindowedReport(mockProject, mockWeeks, filterISO);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBeGreaterThan(0);
    });

    it('handles empty weeks', () => {
      const mockProject = { id: 'test' };
      const result = aggregateWindowedReport(mockProject, [], () => true);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('handles localStorage errors gracefully', async () => {
      const mockProject = { id: 'test' };
      const mockWeeks = [{ startDate: '2023-01-01' }];

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { weekISOdays, weekAllPeopleActive, stripPR, buildRefuerzoIndex } =
        await import('./plan.ts');
      weekISOdays.mockReturnValue(['2023-01-01']);
      weekAllPeopleActive.mockReturnValue([]);
      stripPR.mockImplementation(role => role.replace(/[PR]$/, ''));
      buildRefuerzoIndex.mockReturnValue(new Set());

      const result = aggregateWindowedReport(
        mockProject,
        mockWeeks,
        () => true
      );
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });
});
