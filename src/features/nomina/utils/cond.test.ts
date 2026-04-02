import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { loadCondModel } from './cond.ts';

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

const expectLegacyPricesPreserved = (result: any, prices: Record<string, any>) => {
  expect(result).toMatchObject({ params: expect.any(Object), prices: expect.any(Object) });
  Object.entries(prices).forEach(([key, value]) => {
    expect(result.prices[key]).toEqual(value);
  });
};

describe('nomina/utils/cond', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadCondModel', () => {
    it('loads model with project id and conditionsMode', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'semanal',
      };

      const mockModel = {
        prices: { G: { 'Precio jornada': '100' } },
        params: { divTravel: '2' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('loads model with project nombre when id is not available', () => {
      const mockProject = {
        nombre: 'test-project-name',
        conditionsMode: 'mensual',
      };

      const mockModel = {
        prices: { E: { 'Precio jornada': '80' } },
        params: { transporteDia: '20' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project-name_mensual'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('uses conditions.tipo when conditionsMode is not available', () => {
      const mockProject = {
        id: 'test-project',
        conditions: {
          tipo: 'diario',
        },
      };

      const mockModel = {
        roles: ['Gaffer', 'Eléctrico'],
        prices: { 
          'Gaffer': { 'Precio jornada': '510' },
          'Eléctrico': { 'Precio jornada': '310' },
          'TM': { 'Precio jornada': '60' } 
        },
        params: { kilometrajeKm: '0.5' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_diario'
      );
      expect(result.roles).toEqual(['g_default', 'e_default']);
      expect(result.prices.g_default).toEqual({ 'Precio jornada': '510' });
      expect(result.prices.e_default).toEqual({ 'Precio jornada': '310' });
      expect(result.params).toEqual({ kilometrajeKm: '0.5' });
    });

    it('uses conditions.mode when tipo is not available', () => {
      const mockProject = {
        id: 'test-project',
        conditions: {
          mode: 'semanal',
        },
      };

      const mockModel = {
        prices: { BB: { 'Precio jornada': '90' } },
        params: { dietaComida: '15' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('defaults to semanal when no mode is specified', () => {
      const mockProject = {
        id: 'test-project',
      };

      const mockModel = {
        prices: { AUX: { 'Precio jornada': '50' } },
        params: { dietaCena: '25' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('uses modeOverride when provided', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'mensual',
      };

      const mockModel = {
        roles: ['Gaffer', 'Eléctrico'],
        prices: { 
          'Gaffer': { 'Precio jornada': '510' },
          'Eléctrico': { 'Precio jornada': '310' },
          'M': { 'Precio jornada': '40' } 
        },
        params: { gastosBolsillo: '10' },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject, 'diario');

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_diario'
      );
      expect(result.roles).toEqual(['g_default', 'e_default']);
      expect(result.prices.g_default).toEqual({ 'Precio jornada': '510' });
      expect(result.prices.e_default).toEqual({ 'Precio jornada': '310' });
      expect(result.params).toEqual({ gastosBolsillo: '10' });
    });

    it('tries multiple keys in order of priority', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'custom',
      };

      const mockModel = {
        prices: { REF: { 'Precio refuerzo': '70' } },
        params: { dietaAlojDes: '50' },
      };

      // First key returns null, second key returns the model
      localStorageMock.getItem
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_custom'
      );
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_mensual'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('tries all fallback keys when primary key fails', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'nonexistent',
      };

      const mockModel = {
        roles: ['Gaffer', 'Eléctrico'],
        prices: { 
          'Gaffer': { 'Precio jornada': '510' },
          'Eléctrico': { 'Precio jornada': '310' },
          'FB': { 'Precio jornada': '45' } 
        },
        params: { dietaSinPernocta: '30' },
      };

      // All keys except the last one return null
      localStorageMock.getItem
        .mockReturnValueOnce(null) // cond_test-project_nonexistent
        .mockReturnValueOnce(null) // cond_test-project_mensual
        .mockReturnValueOnce(null) // cond_test-project_semanal
        .mockReturnValueOnce(JSON.stringify(mockModel)); // cond_test-project_publicidad

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(4);
      expect(result.roles).toEqual(['g_default', 'e_default']);
      expect(result.prices.g_default).toEqual({ 'Precio jornada': '510' });
      expect(result.prices.e_default).toEqual({ 'Precio jornada': '310' });
      expect(result.params).toEqual({ dietaSinPernocta: '30' });
    });

    it('prioritizes project.conditions content over stale localStorage', () => {
      const mockProject = {
        id: 'test-project',
        conditions: {
          tipo: 'diario',
          diario: {
            roles: ['gaffer_default', 'electric_default', 'electric_factura'],
            prices: {
              gaffer_default: { 'Precio jornada': '510' },
              electric_default: { 'Precio jornada': '350' },
              electric_factura: { 'Precio jornada': '300' },
            },
            params: { kilometrajeKm: '0.4' },
          },
        },
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          roles: ['Gaffer', 'Eléctrico'],
          prices: {
            Gaffer: { 'Precio jornada': '510' },
            'Eléctrico': { 'Precio jornada': '310' },
          },
        })
      );

      const result = loadCondModel(mockProject);

      expect(result.roles).toEqual(['electric_default', 'electric_factura', 'gaffer_default']);
      expect(result.prices.gaffer_default).toEqual({ 'Precio jornada': '510' });
      expect(result.prices.electric_default).toEqual({ 'Precio jornada': '350' });
      expect(result.prices.electric_factura).toEqual({ 'Precio jornada': '300' });
      expect(result.params).toEqual({ kilometrajeKm: '0.4' });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('returns empty object when no model is found', () => {
      const mockProject = {
        id: 'test-project',
      };

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(5);
      expect(result).toEqual({});
    });

    it('handles invalid JSON gracefully', () => {
      const mockProject = {
        id: 'test-project',
      };

      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledTimes(5);
      expect(result).toEqual({});
    });

    it('handles localStorage errors gracefully', () => {
      const mockProject = {
        id: 'test-project',
      };

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = loadCondModel(mockProject);

      expect(result).toEqual({});
    });

    it('converts mode to lowercase', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: 'SEMANAL',
      };

      const mockModel = {
        prices: { G: { 'Precio jornada': '100' } },
        params: {},
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockModel));

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expectLegacyPricesPreserved(result, mockModel.prices);
      expect(result.roles).toEqual(['g_default', 'e_default']);
    });

    it('handles null project gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(null);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cond_tmp_semanal');
      expect(result).toEqual({});
    });

    it('handles project with no id or nombre', () => {
      const mockProject = {};

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cond_tmp_semanal');
      expect(result).toEqual({});
    });

    it('handles project with empty conditionsMode', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: '',
      };

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expect(result).toEqual({});
    });

    it('handles project with null conditionsMode', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: null,
      };

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expect(result).toEqual({});
    });

    it('handles project with undefined conditionsMode', () => {
      const mockProject = {
        id: 'test-project',
        conditionsMode: undefined,
      };

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadCondModel(mockProject);

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'cond_test-project_semanal'
      );
      expect(result).toEqual({});
    });
  });
});
