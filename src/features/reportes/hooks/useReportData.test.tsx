import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useReportData from './useReportData';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => [{}, vi.fn()]),
}));

describe('useReportData', () => {
  const mockSafePersonas = [
    { role: 'G', name: 'Juan' },
    { role: 'BB', name: 'María' },
  ];
  const mockSafeSemana = ['2024-01-15', '2024-01-16', '2024-01-17'];
  const mockCONCEPTS = ['Dietas', 'Transporte', 'Kilometraje'];
  const mockIsPersonScheduledOn = vi.fn();
  const mockFindWeekAndDay = vi.fn();
  const setDataMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocalStorage as unknown as ReturnType<typeof vi.fn>).mockReturnValue([{}, setDataMock]);
  });

  it('should initialize with empty data structure', () => {
    const { result } = renderHook(() =>
      useReportData(
        'test-key',
        mockSafePersonas,
        mockSafeSemana,
        mockCONCEPTS,
        mockIsPersonScheduledOn,
        mockFindWeekAndDay
      )
    );

    expect(result.current.data).toEqual({});
  });

  it('should provide setCell function', () => {
    const { result } = renderHook(() =>
      useReportData(
        'test-key',
        mockSafePersonas,
        mockSafeSemana,
        mockCONCEPTS,
        mockIsPersonScheduledOn,
        mockFindWeekAndDay
      )
    );

    expect(typeof result.current.setCell).toBe('function');
  });

  it('clears dietas in related extra/base keys for current date only', () => {
    const safePersonas = [
      { role: 'BB', roleId: 'bb_default', name: 'Maria' },
      { role: 'BB', roleId: 'bb_default', name: 'Maria', __block: 'extra:0' },
    ];
    const semana = ['2024-01-15', '2024-01-16', '2024-01-17'];
    (useLocalStorage as unknown as ReturnType<typeof vi.fn>).mockReturnValue([{}, setDataMock]);
    mockIsPersonScheduledOn.mockReturnValue(true);

    const { result } = renderHook(() =>
      useReportData(
        'test-key',
        safePersonas as any,
        semana,
        mockCONCEPTS,
        mockIsPersonScheduledOn,
        mockFindWeekAndDay
      )
    );

    const prevState = {
      'bb_default__Maria': {
        Dietas: {
          '2024-01-15': '',
          '2024-01-16': 'Gastos de bolsillo',
          '2024-01-17': '',
        },
      },
      'bb_default.extra:0__Maria': {
        Dietas: {
          '2024-01-15': 'Comida',
          '2024-01-16': 'Comida',
          '2024-01-17': '',
        },
      },
    };

    act(() => {
      result.current.setCell('bb_default__Maria', 'Dietas', '2024-01-16', '');
    });

    expect(setDataMock).toHaveBeenCalled();
    const updater = setDataMock.mock.calls[setDataMock.mock.calls.length - 1][0] as (d: any) => any;
    const next = updater(prevState);

    expect(next['bb_default__Maria'].Dietas['2024-01-16']).toBe('');
    expect(next['bb_default.extra:0__Maria'].Dietas['2024-01-16']).toBe('');
    expect(next['bb_default.extra:0__Maria'].Dietas['2024-01-15']).toBe('Comida');
  });

  it('clearing one person dietas does not clear other person', () => {
    const safePersonas = [
      { role: 'BB', roleId: 'bb_default', name: 'Maria' },
      { role: 'BB', roleId: 'bb_default', name: 'Ana' },
      { role: 'BB', roleId: 'bb_default', name: 'Maria', __block: 'extra:0' },
    ];
    const semana = ['2024-01-15', '2024-01-16', '2024-01-17'];
    (useLocalStorage as unknown as ReturnType<typeof vi.fn>).mockReturnValue([{}, setDataMock]);
    mockIsPersonScheduledOn.mockReturnValue(true);

    const { result } = renderHook(() =>
      useReportData(
        'test-key',
        safePersonas as any,
        semana,
        mockCONCEPTS,
        mockIsPersonScheduledOn,
        mockFindWeekAndDay
      )
    );

    const prevState = {
      'bb_default__Maria': { Dietas: { '2024-01-16': 'Comida' } },
      'bb_default.extra:0__Maria': { Dietas: { '2024-01-16': 'Comida' } },
      'bb_default__Ana': { Dietas: { '2024-01-16': 'Comida' } },
    };

    act(() => {
      result.current.setCell('bb_default__Maria', 'Dietas', '2024-01-16', '');
    });

    const updater = setDataMock.mock.calls[setDataMock.mock.calls.length - 1][0] as (d: any) => any;
    const next = updater(prevState);

    expect(next['bb_default__Maria'].Dietas['2024-01-16']).toBe('');
    expect(next['bb_default.extra:0__Maria'].Dietas['2024-01-16']).toBe('');
    expect(next['bb_default__Ana'].Dietas['2024-01-16']).toBe('Comida');
  });
});
