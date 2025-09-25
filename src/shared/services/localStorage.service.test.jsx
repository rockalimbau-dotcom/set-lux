import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../test/setup.ts';
import { storage } from './localStorage.service';

describe('shared/services/localStorage.service', () => {
  const KEY = 'test_key';

  beforeEach(() => {
    // Provide an in-memory localStorage for this test suite (overrides global mock spies)
    const store = new Map();
    const mem = {
      getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
      setItem: vi.fn((k, v) => { store.set(k, String(v)); }),
      removeItem: vi.fn((k) => { store.delete(k); }),
      clear: vi.fn(() => store.clear()),
    };
    Object.defineProperty(window, 'localStorage', { value: mem, configurable: true });
    store.clear();
  });

  it('setString/getString/remove work as expected', () => {
    expect(storage.getString(KEY)).toBeNull();
    storage.setString(KEY, 'hello');
    expect(storage.getString(KEY)).toBe('hello');
    storage.remove(KEY);
    expect(storage.getString(KEY)).toBeNull();
  });

  it('setJSON/getJSON store and retrieve structured data', () => {
    const obj = { a: 1, b: 'two', c: [3, 4], d: { e: true } };
    storage.setJSON(KEY, obj);
    expect(storage.getJSON(KEY)).toEqual(obj);

    storage.setJSON(KEY, [1, 2, 3]);
    expect(storage.getJSON(KEY)).toEqual([1, 2, 3]);

    storage.setJSON(KEY, 'plain');
    expect(storage.getJSON(KEY)).toBe('plain');
  });

  it('getJSON returns null on invalid JSON payload', () => {
    window.localStorage.setItem(KEY, 'not-json');
    expect(storage.getJSON(KEY)).toBeNull();
  });

  it('methods are resilient to localStorage errors', () => {
    const setSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('set fail');
    });
    const getSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('get fail');
    });
    const remSpy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('rem fail');
    });

    // Should not throw
    expect(() => storage.setString(KEY, 'x')).not.toThrow();
    expect(storage.getString(KEY)).toBeNull();
    expect(() => storage.remove(KEY)).not.toThrow();

    // cleanup spies so other tests are not affected
    setSpy.mockRestore();
    getSpy.mockRestore();
    remSpy.mockRestore();
  });
});


