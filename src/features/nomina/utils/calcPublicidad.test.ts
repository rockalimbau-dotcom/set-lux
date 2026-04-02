import { storage } from '@shared/services/localStorage.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { makeRolePrices } from './calcPublicidad';

// Mock the storage service
vi.mock('@shared/services/localStorage.service', () => ({
  storage: {
    getJSON: vi.fn(),
  },
}));

describe('calcPublicidad - makeRolePrices with holidayDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include holidayDay price for regular roles in diario', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'diario' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '180',
          'Travel day': '72', // 180 / 2.5 (divisor publicidad)
          'Horas extras': '28',
          'Precio Día extra/Festivo': '315', // 180 * 1.75
        },
      },
      params: {
        divTravel: '2.5', // Publicidad usa divisor 2.5
        transporteDia: '15',
        kilometrajeKm: '0.25',
        dietaComida: '12',
        dietaCena: '18',
        dietaSinPernocta: '25',
        dietaAlojDes: '35',
        gastosBolsillo: '8',
      },
    });

    const rolePrices = makeRolePrices(mockProject);
    const gafferPrices = rolePrices.getForRole('GAFFER');

    expect(gafferPrices).toHaveProperty('holidayDay');
    expect(gafferPrices.holidayDay).toBe(315);
    expect(gafferPrices.jornada).toBe(180);
    expect(gafferPrices.travelDay).toBe(72);
    expect(gafferPrices.horaExtra).toBe(28);
  });

  it('should include holidayDay price for REF roles in diario', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'diario' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio refuerzo': '140',
          'Precio Día extra/Festivo': '245', // 140 * 1.75
        },
        ELÉCTRICO: {
          'Precio refuerzo': '110',
          'Precio Día extra/Festivo': '192.5', // 110 * 1.75
        },
      },
      params: {
        divTravel: '2.5',
        transporteDia: '15',
        kilometrajeKm: '0.25',
        dietaComida: '12',
        dietaCena: '18',
        dietaSinPernocta: '25',
        dietaAlojDes: '35',
        gastosBolsillo: '8',
      },
    });

    const rolePrices = makeRolePrices(mockProject);
    const refPrices = rolePrices.getForRole('REF', 'GAFFER');

    expect(refPrices).toHaveProperty('holidayDay');
    expect(refPrices.holidayDay).toBe(192.5); // Fallback to Eléctrico row, igual que semanal/mensual
  });

  it('should return 0 for holidayDay when not defined in diario', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'diario' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '180',
          // No 'Precio Día extra/Festivo' defined
        },
      },
      params: {
        divTravel: '2.5',
      },
    });

    const rolePrices = makeRolePrices(mockProject);
    const gafferPrices = rolePrices.getForRole('GAFFER');

    expect(gafferPrices).toHaveProperty('holidayDay');
    expect(gafferPrices.holidayDay).toBe(0);
  });

  it('should resolve custom diario role prices by roleId', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'diario' },
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'electric_night',
            label: 'Eléctrico noche',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 20,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    storage.getJSON = vi.fn().mockReturnValue({
      roles: ['electric_night'],
      prices: {
        electric_night: {
          'Precio jornada': '320',
          'Travel day': '160',
          'Horas extras': '40',
          'Precio Día extra/Festivo': '560',
          'Carga/descarga': '150',
        },
      },
      params: {},
    });

    const rolePrices = makeRolePrices(mockProject);
    const prices = rolePrices.getForRole('Eléctrico noche', null, {
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
    });

    expect(prices.jornada).toBe(320);
    expect(prices.travelDay).toBe(160);
    expect(prices.horaExtra).toBe(40);
    expect(prices.holidayDay).toBe(560);
    expect(prices.cargaDescarga).toBe(150);
  });

  it('falls back to the custom base price when pickup/prelight only has the base role row', () => {
    const mockProject = {
      id: 'test-project',
      conditions: {
        tipo: 'diario',
        diario: {
          roles: ['e_default', 'electric_factura'],
          prices: {
            e_default: { 'Precio jornada': '350' },
            electric_factura: { 'Precio jornada': '300' },
          },
          pricesPickup: {
            e_default: { 'Precio jornada': '350' },
          },
          params: {},
        },
      },
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'e_default',
            label: 'Eléctrico/a',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 2,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'electric_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 2,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    const rolePrices = makeRolePrices(mockProject);
    const prices = rolePrices.getForRole('ER', null, {
      roleId: 'electric_factura',
      roleLabel: 'Eléctrico factura',
    });

    expect(prices.jornada).toBe(300);
  });

  it('resolves the custom diario role by roleLabel when roleId is missing', () => {
    const mockProject = {
      id: 'test-project',
      conditions: {
        tipo: 'diario',
        diario: {
          roles: ['e_default', 'electric_factura'],
          prices: {
            e_default: { 'Precio jornada': '350' },
            electric_factura: { 'Precio jornada': '300' },
          },
          params: {},
        },
      },
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'e_default',
            label: 'Eléctrico/a',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 2,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'electric_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 20,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
    };

    const rolePrices = makeRolePrices(mockProject);
    const prices = rolePrices.getForRole('E', null, {
      roleLabel: 'Eléctrico factura',
    });

    expect(prices.jornada).toBe(300);
  });
});
