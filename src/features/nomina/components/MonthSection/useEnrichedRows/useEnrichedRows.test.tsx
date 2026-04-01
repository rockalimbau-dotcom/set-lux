import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEnrichedRows } from './useEnrichedRows';

describe('useEnrichedRows', () => {
  it('separates base and extra crew breakdown sources for the same person', () => {
    const calcWorkedBreakdown = vi.fn(() => ({
      workedDays: 0,
      travelDays: 0,
      workedBase: 0,
      workedPre: 0,
      workedPick: 0,
      holidayDays: 0,
      halfDays: 0,
      rodaje: 0,
      pruebasCamara: 0,
      oficina: 0,
      travelDay: 0,
      carga: 0,
      descarga: 0,
      localizar: 0,
      rodajeFestivo: 0,
      prelight: 0,
      recogida: 0,
    }));

    renderHook(() =>
      useEnrichedRows({
        rows: [
          {
            role: 'E',
            name: 'Ricard Durany',
            source: 'base',
            _displayBlock: 'base',
            extras: 0,
            horasExtra: 0,
            turnAround: 0,
            nocturnidad: 0,
            penaltyLunch: 0,
            transporte: 0,
            km: 0,
            gasolina: 0,
            dietasCount: new Map(),
            ticketTotal: 0,
            otherTotal: 0,
          },
          {
            role: 'E',
            name: 'Ricard Durany',
            source: 'extra',
            _displayBlock: 'extra',
            _rowKey: 'E.extra__Ricard Durany',
            extras: 0,
            horasExtra: 0,
            turnAround: 0,
            nocturnidad: 0,
            penaltyLunch: 0,
            transporte: 0,
            km: 0,
            gasolina: 0,
            dietasCount: new Map(),
            ticketTotal: 0,
            otherTotal: 0,
          },
        ],
        weeksForMonth: [],
        filterISO: () => true,
        rolePrices: {
          getForRole: () => ({
            jornada: 0,
            halfJornada: 0,
            travelDay: 0,
            horaExtra: 0,
            holidayDay: 0,
            transporte: 0,
            km: 0,
            dietas: {},
          }),
        },
        windowOverrideMap: null,
        refuerzoSet: new Set(),
        stripPR: (role: string) => role,
        calcWorkedBreakdown,
        filteredData: null,
        dateFrom: '',
        dateTo: '',
        projectMode: 'diario',
        calculateWorkingDaysInMonthValue: 0,
        priceDays: 0,
        roleLabelFromCode: (role: string) => role,
        isFirstProjectMonth: true,
      })
    );

    expect(calcWorkedBreakdown).toHaveBeenCalledTimes(2);
    expect(calcWorkedBreakdown.mock.calls[0]?.[2]).toEqual({
      role: 'E',
      name: 'Ricard Durany',
      source: 'base-strict',
    });
    expect(calcWorkedBreakdown.mock.calls[1]?.[2]).toEqual({
      role: 'E',
      name: 'Ricard Durany',
      source: 'ref',
    });
  });
});
