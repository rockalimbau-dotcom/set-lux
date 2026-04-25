import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useMensualRoles } from './useMensualRoles';

describe('useMensualRoles', () => {
  it('preserva importes derivados editados manualmente al montar', async () => {
    const model = {
      roles: ['Gaffer'],
      params: {
        semanasMes: '4',
        diasJornada: '5',
        diasDiario: '7',
        horasSemana: '45',
        factorFestivo: '1.75',
        factorHoraExtra: '1.5',
        divTravel: '2',
      },
      prices: {
        Gaffer: {
          'Precio mensual': '4000',
          'Precio jornada': '999',
        },
      },
    };
    const setModel = vi.fn((updater: any) => updater(model));

    renderHook(() => useMensualRoles({ project: { id: 'p1' }, model, setModel }));

    await waitFor(() => expect(setModel).toHaveBeenCalled());
    const next = setModel.mock.results[0].value;

    expect(next.prices.Gaffer['Precio jornada']).toBe('999');
    expect(next.prices.Gaffer['Precio semanal']).toBe('1000');
  });

  it('recalcula importes derivados cuando cambia el precio mensual', async () => {
    const params = {
      semanasMes: '4',
      diasJornada: '5',
      diasDiario: '7',
      horasSemana: '45',
      factorFestivo: '1.75',
      factorHoraExtra: '1.5',
      divTravel: '2',
    };
    const initialModel = {
      roles: ['Gaffer'],
      params,
      prices: {
        Gaffer: {
          'Precio mensual': '4000',
          'Precio jornada': '999',
        },
      },
    };
    const updatedModel = {
      ...initialModel,
      prices: {
        Gaffer: {
          ...initialModel.prices.Gaffer,
          'Precio mensual': '5000',
        },
      },
    };
    const setModel = vi.fn((updater: any) => updater(updatedModel));

    const { rerender } = renderHook(({ model }) => useMensualRoles({ project: { id: 'p1' }, model, setModel }), {
      initialProps: { model: initialModel },
    });
    rerender({ model: updatedModel });

    await waitFor(() => expect(setModel).toHaveBeenCalledTimes(2));
    const next = setModel.mock.results[1].value;

    expect(next.prices.Gaffer['Precio jornada']).toBe('250');
  });
});
