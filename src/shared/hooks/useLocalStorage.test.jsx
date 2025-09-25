import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage.ts';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock StorageEvent
const createStorageEvent = (key, newValue, oldValue) => ({
  key,
  newValue,
  oldValue,
  storageArea: localStorageMock,
  url: 'http://localhost',
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
      
      expect(result.current[0]).toBe('initial-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('initializes with function initial value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('test-key', () => 'function-value')
      );
      
      expect(result.current[0]).toBe('function-value');
    });

    it('initializes with value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('"stored-value"');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
      
      expect(result.current[0]).toBe('stored-value');
    });

    it('falls back to initial value when localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback-value'));
      
      expect(result.current[0]).toBe('fallback-value');
    });

    it('handles complex objects', () => {
      const complexObject = { name: 'test', count: 42, nested: { value: true } };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));
      
      const { result } = renderHook(() => useLocalStorage('test-key', {}));
      
      expect(result.current[0]).toEqual(complexObject);
    });
  });

  describe('setValue', () => {
    it('updates value and stores in localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
    });

    it('updates value with function updater', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0));
      
      act(() => {
        result.current[1](prev => prev + 1);
      });
      
      expect(result.current[0]).toBe(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '1');
    });

    it('handles complex object updates', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', { count: 0 }));
      
      act(() => {
        result.current[1]({ count: 5, name: 'test' });
      });
      
      expect(result.current[0]).toEqual({ count: 5, name: 'test' });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '{"count":5,"name":"test"}');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });
      
      // Should still update the state even if localStorage fails
      expect(result.current[0]).toBe('new-value');
    });
  });

  describe('removeValue', () => {
    it('removes value from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[2](); // remove function
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[2](); // remove function
      });
      
      // Should not throw error
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('cross-tab synchronization', () => {
    it('sets up storage event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('key changes', () => {
    it('handles key changes', () => {
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'initial'),
        { initialProps: { key: 'key1' } }
      );
      
      expect(result.current[0]).toBe('initial');
      
      // Change key - the hook should handle this internally
      rerender({ key: 'key2' });
      
      // The hook should still work with the new key
      expect(result.current[0]).toBe('initial');
    });
  });

  describe('edge cases', () => {
    it('handles null values', () => {
      localStorageMock.getItem.mockReturnValue('null');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      
      expect(result.current[0]).toBe(null);
    });

    it('handles undefined values', () => {
      localStorageMock.getItem.mockReturnValue('undefined');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      
      expect(result.current[0]).toBe('default');
    });

    it('handles empty string values', () => {
      localStorageMock.getItem.mockReturnValue('""');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      
      expect(result.current[0]).toBe('');
    });

    it('handles boolean values', () => {
      localStorageMock.getItem.mockReturnValue('true');
      
      const { result } = renderHook(() => useLocalStorage('test-key', false));
      
      expect(result.current[0]).toBe(true);
    });

    it('handles number values', () => {
      localStorageMock.getItem.mockReturnValue('42');
      
      const { result } = renderHook(() => useLocalStorage('test-key', 0));
      
      expect(result.current[0]).toBe(42);
    });
  });

  describe('return value structure', () => {
    it('returns array with three elements', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);
    });

    it('first element is the current value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(result.current[0]).toBe('initial');
    });

    it('second element is the setter function', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(typeof result.current[1]).toBe('function');
    });

    it('third element is the remove function', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(typeof result.current[2]).toBe('function');
    });
  });
});
