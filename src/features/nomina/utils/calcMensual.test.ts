import { storage } from '@shared/services/localStorage.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { makeRolePrices } from './calcMensual';

// Mock the storage service
vi.mock('@shared/services/localStorage.service', () => ({
  storage: {
    getJSON: vi.fn(),
  },
}));

describe('calcMensual - makeRolePrices with holidayDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include holidayDay price for regular roles in mensual', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'mensual' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '200',
          'Travel day': '66.67', // 200 / 3 (divisor mensual)
          'Horas extras': '30',
          'Precio Día extra/Festivo': '350', // 200 * 1.75
        },
      },
      params: {
        divTravel: '3', // Mensual usa divisor 3
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
    expect(gafferPrices.holidayDay).toBe(350);
    expect(gafferPrices.jornada).toBe(200);
    expect(gafferPrices.travelDay).toBe(66.67);
    expect(gafferPrices.horaExtra).toBe(30);
  });

  it('should include holidayDay price for REF roles in mensual', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'mensual' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio refuerzo': '150',
          'Precio Día extra/Festivo': '262.5', // 150 * 1.75
        },
        ELÉCTRICO: {
          'Precio refuerzo': '120',
          'Precio Día extra/Festivo': '210', // 120 * 1.75
        },
      },
      params: {
        divTravel: '3',
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
    expect(refPrices.holidayDay).toBe(210); // Takes from ELÉCTRICO row as it's checked first
  });

  it('should return 0 for holidayDay when not defined in mensual', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'mensual' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '200',
          // No 'Precio Día extra/Festivo' defined
        },
      },
      params: {
        divTravel: '3',
      },
    });

    const rolePrices = makeRolePrices(mockProject);
    const gafferPrices = rolePrices.getForRole('GAFFER');

    expect(gafferPrices).toHaveProperty('holidayDay');
    expect(gafferPrices.holidayDay).toBe(0);
  });

  it('should resolve custom role prices by roleId in mensual', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'mensual' },
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
          'Precio jornada': '220',
          'Travel day': '73.33',
          'Horas extras': '30',
          'Precio Día extra/Festivo': '385',
          'Precio mensual': '4100',
        },
      },
      params: {},
    });

    const rolePrices = makeRolePrices(mockProject);
    const prices = rolePrices.getForRole('Eléctrico noche', null, {
      roleId: 'electric_night',
      roleLabel: 'Eléctrico noche',
    });

    expect(prices.jornada).toBe(220);
    expect(prices.horaExtra).toBe(30);
    expect(prices.holidayDay).toBe(385);
    expect(prices.precioMensual).toBe(4100);
  });

  it('should keep base role prices for legacy E even when custom electric roles exist in mensual', () => {
    const mockProject = {
      id: 'test-project',
      conditions: {
        tipo: 'mensual',
        mensual: {
          roles: ['e_default', 'electric_factura'],
          prices: {
            e_default: { 'Precio jornada': '350', 'Horas extras': '45' },
            electric_factura: { 'Precio jornada': '300', 'Horas extras': '30' },
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
    const basePrices = rolePrices.getForRole('E');

    expect(basePrices.jornada).toBe(350);
    expect(basePrices.horaExtra).toBe(45);
  });
});
