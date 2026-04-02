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
      roleId: undefined,
      personId: undefined,
      name: 'Ricard Durany',
      source: 'base-strict',
    });
    expect(calcWorkedBreakdown.mock.calls[1]?.[2]).toEqual({
      role: 'E',
      roleId: undefined,
      personId: undefined,
      name: 'Ricard Durany',
      source: 'ref',
    });
  });

  it('looks up base role prices by legacy code instead of the gendered visible label', () => {
    const calcWorkedBreakdown = vi.fn(() => ({
      workedDays: 1,
      travelDays: 0,
      workedBase: 1,
      workedPre: 0,
      workedPick: 0,
      holidayDays: 0,
      halfDays: 0,
      rodaje: 1,
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
    const getForRole = vi.fn(() => ({
      jornada: 350,
      halfJornada: 0,
      travelDay: 0,
      horaExtra: 45,
      holidayDay: 0,
      transporte: 0,
      km: 0,
      dietas: {},
    }));

    renderHook(() =>
      useEnrichedRows({
        rows: [
          {
            role: 'E',
            name: 'Oriol Monguilod',
            source: 'base',
            gender: 'male',
            roleLabel: 'Elèctric',
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
        ],
        weeksForMonth: [],
        filterISO: () => true,
        rolePrices: { getForRole },
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
        roleLabelFromCode: (role: string) => (role === 'E' ? 'Eléctrico/a' : role),
        isFirstProjectMonth: true,
      })
    );

    expect(getForRole).toHaveBeenCalledWith('E', null, {
      roleId: null,
      roleLabel: 'Elèctric',
    });
  });

  it('passes personId to breakdown so payroll can later merge multiple tariffs for one person', () => {
    const calcWorkedBreakdown = vi.fn(() => ({
      workedDays: 1,
      travelDays: 0,
      workedBase: 1,
      workedPre: 0,
      workedPick: 0,
      holidayDays: 0,
      halfDays: 0,
      rodaje: 1,
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
            roleId: 'electric_factura',
            personId: 'person_pol',
            name: 'Pol Peitx',
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

    expect(calcWorkedBreakdown.mock.calls[0]?.[2]).toEqual({
      role: 'E',
      roleId: 'electric_factura',
      personId: 'person_pol',
      name: 'Pol Peitx',
      source: 'base',
    });
  });

  it('merges rows with the same personId into a single visible payroll row', () => {
    const calcWorkedBreakdown = vi.fn(() => ({
      workedDays: 1,
      travelDays: 0,
      workedBase: 1,
      workedPre: 0,
      workedPick: 0,
      holidayDays: 0,
      halfDays: 0,
      rodaje: 1,
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
    const getForRole = vi.fn((_role: string, _base: string | null, options?: { roleId?: string | null }) => ({
      jornada: options?.roleId === 'electric_factura' ? 300 : 350,
      halfJornada: 0,
      travelDay: 0,
      horaExtra: 0,
      holidayDay: 0,
      transporte: 0,
      km: 0,
      dietas: {},
    }));

    const { result } = renderHook(() =>
      useEnrichedRows({
        rows: [
          {
            role: 'E',
            roleId: 'electric_default',
            personId: 'person_pol',
            name: 'Pol Peitx',
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
            roleId: 'electric_factura',
            personId: 'person_pol',
            name: 'Pol Peitx',
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
        ],
        weeksForMonth: [],
        filterISO: () => true,
        rolePrices: { getForRole },
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

    expect(result.current).toHaveLength(1);
    expect(result.current[0]?._rowKey).toBe('person:person_pol');
    expect(result.current[0]?._totalBruto).toBe(650);
    expect(result.current[0]?._roleVariants).toHaveLength(2);
  });
});
