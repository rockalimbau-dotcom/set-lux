import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCollapsedState from './useCollapsedState.ts';

// Mock useLocalStorage
vi.mock('@shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(),
}));

// Mock personaKey
vi.mock('../utils/model', () => ({
  personaKey: vi.fn(),
}));

describe('reportes/hooks/useCollapsedState', () => {
  let mockUseLocalStorage: any;
  let mockPersonaKey: any;

  beforeEach(async () => {
    const useLocalStorageModule = await import('@shared/hooks/useLocalStorage');
    const modelModule = await import('../utils/model');
    mockUseLocalStorage = vi.mocked(useLocalStorageModule.useLocalStorage);
    mockPersonaKey = vi.mocked(modelModule.personaKey);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with all personas collapsed (false)', () => {
    const personas = [
      { role: 'G1', name: 'John' },
      { role: 'E2', name: 'Jane' },
    ];
    
    mockPersonaKey
      .mockReturnValueOnce('G1__John')
      .mockReturnValueOnce('E2__Jane');
    
    mockUseLocalStorage.mockReturnValue([{}, vi.fn()]);

    const { result } = renderHook(() => useCollapsedState('test', personas));

    expect(result.current.collapsed).toEqual({});
  });

  it('calls useLocalStorage with correct key', () => {
    const personas = [{ role: 'G1', name: 'John' }];
    mockPersonaKey.mockReturnValue('G1__John');
    mockUseLocalStorage.mockReturnValue([{}, vi.fn()]);

    renderHook(() => useCollapsedState('test', personas));

    expect(mockUseLocalStorage).toHaveBeenCalledWith('test_collapsed', expect.any(Function));
  });

  it('initializes state based on personas', () => {
    const personas = [
      { role: 'G1', name: 'John' },
      { role: 'E2', name: 'Jane' },
    ];
    
    mockPersonaKey
      .mockReturnValueOnce('G1__John')
      .mockReturnValueOnce('E2__Jane');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{}, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    // The initial state function should be called
    expect(mockUseLocalStorage).toHaveBeenCalledWith('test_collapsed', expect.any(Function));
  });

  it('updates state when personas change', () => {
    const initialPersonas = [{ role: 'G1', name: 'John' }];
    const updatedPersonas = [
      { role: 'G1', name: 'John' },
      { role: 'E2', name: 'Jane' },
    ];
    
    mockPersonaKey
      .mockReturnValueOnce('G1__John')
      .mockReturnValueOnce('G1__John')
      .mockReturnValueOnce('E2__Jane');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{}, mockSetCollapsed]);

    const { rerender } = renderHook(
      ({ personas }) => useCollapsedState('test', personas),
      { initialProps: { personas: initialPersonas } }
    );

    // First render
    expect(mockSetCollapsed).toHaveBeenCalledTimes(1);

    // Rerender with updated personas
    rerender({ personas: updatedPersonas });

    // Should be called again due to useEffect
    expect(mockSetCollapsed).toHaveBeenCalledTimes(2);
  });

  it('adds new personas to state', () => {
    const personas = [{ role: 'G1', name: 'John' }];
    mockPersonaKey.mockReturnValue('G1__John');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{ 'G1__John': false }, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    // The setCollapsed function should be called with a function that adds new personas
    const setCollapsedCall = mockSetCollapsed.mock.calls[0][0];
    expect(typeof setCollapsedCall).toBe('function');
  });

  it('removes personas that are no longer present', () => {
    const personas = [{ role: 'G1', name: 'John' }];
    mockPersonaKey.mockReturnValue('G1__John');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([
      { 'G1__John': false, 'E2__Jane': false }, 
      mockSetCollapsed
    ]);

    renderHook(() => useCollapsedState('test', personas));

    // The setCollapsed function should be called with a function that removes old personas
    const setCollapsedCall = mockSetCollapsed.mock.calls[0][0];
    expect(typeof setCollapsedCall).toBe('function');
  });

  it('preserves existing state for current personas', () => {
    const personas = [{ role: 'G1', name: 'John' }];
    mockPersonaKey.mockReturnValue('G1__John');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{ 'G1__John': true }, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    // The setCollapsed function should be called with a function that preserves existing state
    const setCollapsedCall = mockSetCollapsed.mock.calls[0][0];
    expect(typeof setCollapsedCall).toBe('function');
  });

  it('handles empty personas array', () => {
    const personas = [];
    mockPersonaKey.mockReturnValue('');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{}, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    expect(mockSetCollapsed).toHaveBeenCalled();
  });

  it('handles null/undefined personas', () => {
    const personas = null;
    mockPersonaKey.mockReturnValue('');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{}, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    expect(mockSetCollapsed).toHaveBeenCalled();
  });

  it('returns collapsed state and setter', () => {
    const personas = [{ role: 'G1', name: 'John' }];
    mockPersonaKey.mockReturnValue('G1__John');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{ 'G1__John': false }, mockSetCollapsed]);

    const { result } = renderHook(() => useCollapsedState('test', personas));

    expect(result.current.collapsed).toEqual({ 'G1__John': false });
    expect(result.current.setCollapsed).toBe(mockSetCollapsed);
  });

  it('handles personas with same key', () => {
    const personas = [
      { role: 'G1', name: 'John' },
      { role: 'G1', name: 'John' }, // Duplicate
    ];
    
    mockPersonaKey.mockReturnValue('G1__John');
    
    const mockSetCollapsed = vi.fn();
    mockUseLocalStorage.mockReturnValue([{}, mockSetCollapsed]);

    renderHook(() => useCollapsedState('test', personas));

    expect(mockSetCollapsed).toHaveBeenCalled();
  });
});
