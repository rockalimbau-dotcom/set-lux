import { storage } from '@shared/services/localStorage.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { makeRolePrices } from './calcSemanal';

// Mock the storage service
vi.mock('@shared/services/localStorage.service', () => ({
  storage: {
    getJSON: vi.fn(),
  },
}));

describe('calcSemanal - makeRolePrices with holidayDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include holidayDay price for regular roles', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'semanal' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '150',
          'Travel day': '75',
          'Horas extras': '25',
          'Precio Día extra/Festivo': '262.5', // 150 * 1.75
        },
      },
      params: {
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
    expect(gafferPrices.holidayDay).toBe(262.5);
    expect(gafferPrices.jornada).toBe(150);
    expect(gafferPrices.travelDay).toBe(75);
    expect(gafferPrices.horaExtra).toBe(25);
  });

  it('should include holidayDay price for REF roles', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'semanal' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio refuerzo': '120',
          'Precio Día extra/Festivo': '210', // 120 * 1.75
        },
        ELÉCTRICO: {
          'Precio refuerzo': '100',
          'Precio Día extra/Festivo': '175', // 100 * 1.75
        },
      },
      params: {
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
    expect(refPrices.holidayDay).toBe(175); // Takes from ELÉCTRICO row as it's checked first
  });

  it('should return 0 for holidayDay when not defined', () => {
    const mockProject = {
      id: 'test-project',
      conditions: { tipo: 'semanal' },
    };

    // Mock the storage to return the conditions data
    storage.getJSON = vi.fn().mockReturnValue({
      prices: {
        GAFFER: {
          'Precio jornada': '150',
          // No 'Precio Día extra/Festivo' defined
        },
      },
      params: {},
    });

    const rolePrices = makeRolePrices(mockProject);
    const gafferPrices = rolePrices.getForRole('GAFFER');

    expect(gafferPrices).toHaveProperty('holidayDay');
    expect(gafferPrices.holidayDay).toBe(0);
  });
});

