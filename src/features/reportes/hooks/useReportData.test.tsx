import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import useReportData from './useReportData';

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
});
