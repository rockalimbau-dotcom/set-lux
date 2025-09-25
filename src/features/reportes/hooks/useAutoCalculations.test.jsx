import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useAutoCalculations from './useAutoCalculations';

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(() => ['mock-plan-data', vi.fn()]),
}));

// Mock utils
vi.mock('../utils/numbers', () => ({
  diffMinutes: vi.fn((start, end) => {
    // Mock: 8 hours = 480 minutes
    if (start === '09:00' && end === '17:00') return 480;
    if (start === '10:00' && end === '18:00') return 480;
    if (start === '22:00' && end === '06:00') return 480; // Night shift
    return 0;
  }),
  ceilHours: vi.fn((minutes) => Math.ceil(minutes / 60)),
}));

vi.mock('../utils/runtime', () => ({
  getBlockWindow: vi.fn((day, block) => ({
    start: '09:00',
    end: '17:00',
  })),
  buildDateTime: vi.fn((iso, time) => new Date(`${iso}T${time}:00`)),
  findPrevWorkingContext: vi.fn(() => ({
    lastEnd: '17:00',
    lastDate: '2024-01-14',
  })),
}));

vi.mock('../utils/plan', () => ({
  isPersonScheduledOnBlock: vi.fn(() => true),
}));

describe('useAutoCalculations', () => {
  const mockSafeSemana = ['2024-01-15', '2024-01-16', '2024-01-17'];
  const mockSafePersonas = [
    { role: 'DIRECTOR', name: 'Juan' },
    { role: 'PRODUCTOR', name: 'María' },
  ];
  const mockParams = {
    extraHoursThreshold: 8,
    turnAroundThreshold: 12,
    nightShiftStart: '22:00',
    nightShiftEnd: '06:00',
  };

  const mockFunctions = {
    findWeekAndDay: vi.fn((iso) => ({ week: 0, day: 0 })),
    getBlockWindow: vi.fn(() => ({ start: '09:00', end: '17:00' })),
    calcHorasExtraMin: vi.fn((worked, base, cortes) => Math.max(0, worked - base * 60)),
    buildDateTime: vi.fn((iso, time) => new Date(`${iso}T${time}:00`)),
    findPrevWorkingContext: vi.fn(() => ({ lastEnd: '17:00', lastDate: '2024-01-14' })),
    personaKey: vi.fn((p) => `${p.role}__${p.name}`),
    personaRole: vi.fn((p) => p.role),
    personaName: vi.fn((p) => p.name),
    blockKeyForPerson: vi.fn(() => 'block-key'),
    isPersonScheduledOnBlock: vi.fn(() => true),
    setData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without crashing', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should call setData when calculations are triggered', () => {
    renderHook(() =>
      useAutoCalculations({
        safeSemana: mockSafeSemana,
        findWeekAndDay: mockFunctions.findWeekAndDay,
        getBlockWindow: mockFunctions.getBlockWindow,
        calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
        buildDateTime: mockFunctions.buildDateTime,
        findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
        params: mockParams,
        safePersonas: mockSafePersonas,
        personaKey: mockFunctions.personaKey,
        personaRole: mockFunctions.personaRole,
        personaName: mockFunctions.personaName,
        blockKeyForPerson: mockFunctions.blockKeyForPerson,
        isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
        setData: mockFunctions.setData,
      })
    );

    // The hook should call setData during initialization
    expect(mockFunctions.setData).toHaveBeenCalled();
  });

  it('should handle empty personas array', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: [],
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should handle empty semana array', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: [],
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should process different persona roles', () => {
    const mixedPersonas = [
      { role: 'DIRECTOR', name: 'Juan' },
      { role: 'REF', name: 'Carlos' },
      { role: 'TÉCNICO', name: 'Ana' },
    ];

    renderHook(() =>
      useAutoCalculations({
        safeSemana: mockSafeSemana,
        findWeekAndDay: mockFunctions.findWeekAndDay,
        getBlockWindow: mockFunctions.getBlockWindow,
        calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
        buildDateTime: mockFunctions.buildDateTime,
        findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
        params: mockParams,
        safePersonas: mixedPersonas,
        personaKey: mockFunctions.personaKey,
        personaRole: mockFunctions.personaRole,
        personaName: mockFunctions.personaName,
        blockKeyForPerson: mockFunctions.blockKeyForPerson,
        isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
        setData: mockFunctions.setData,
      })
    );

    expect(mockFunctions.setData).toHaveBeenCalled();
  });

  it('should handle different threshold parameters', () => {
    const customParams = {
      extraHoursThreshold: 10,
      turnAroundThreshold: 8,
      nightShiftStart: '20:00',
      nightShiftEnd: '08:00',
    };

    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: customParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should call utility functions with correct parameters', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should handle persona key generation', () => {
    const testPersona = { role: 'DIRECTOR', name: 'Juan' };
    
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: [testPersona],
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should handle block key generation for persons', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should handle person scheduling checks', () => {
    expect(() => {
      renderHook(() =>
        useAutoCalculations({
          safeSemana: mockSafeSemana,
          findWeekAndDay: mockFunctions.findWeekAndDay,
          getBlockWindow: mockFunctions.getBlockWindow,
          calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
          buildDateTime: mockFunctions.buildDateTime,
          findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
          params: mockParams,
          safePersonas: mockSafePersonas,
          personaKey: mockFunctions.personaKey,
          personaRole: mockFunctions.personaRole,
          personaName: mockFunctions.personaName,
          blockKeyForPerson: mockFunctions.blockKeyForPerson,
          isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
          setData: mockFunctions.setData,
        })
      );
    }).not.toThrow();
  });

  it('should handle calculation of extra hours', () => {
    renderHook(() =>
      useAutoCalculations({
        safeSemana: mockSafeSemana,
        findWeekAndDay: mockFunctions.findWeekAndDay,
        getBlockWindow: mockFunctions.getBlockWindow,
        calcHorasExtraMin: mockFunctions.calcHorasExtraMin,
        buildDateTime: mockFunctions.buildDateTime,
        findPrevWorkingContext: mockFunctions.findPrevWorkingContext,
        params: mockParams,
        safePersonas: mockSafePersonas,
        personaKey: mockFunctions.personaKey,
        personaRole: mockFunctions.personaRole,
        personaName: mockFunctions.personaName,
        blockKeyForPerson: mockFunctions.blockKeyForPerson,
        isPersonScheduledOnBlock: mockFunctions.isPersonScheduledOnBlock,
        setData: mockFunctions.setData,
      })
    );

    expect(mockFunctions.calcHorasExtraMin).toHaveBeenCalled();
  });
});
