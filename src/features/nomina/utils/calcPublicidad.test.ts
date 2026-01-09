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
    expect(refPrices.holidayDay).toBe(245); // Takes from GAFFER row as it's checked first in publicidad
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
});

