import { describe, it, expect, beforeEach, vi } from 'vitest';

import '../../test/setup.ts';
import { storage } from '../services/localStorage.service';
import {
  getReportWeekStoredJSON,
  primaryReportStorageBase,
  reportStorageBaseCandidates,
} from './reportStorageKeys';

describe('reportStorageKeys', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const mem = {
      getItem: vi.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
      setItem: vi.fn((k: string, v: string) => {
        store.set(k, String(v));
      }),
      removeItem: vi.fn((k: string) => {
        store.delete(k);
      }),
      clear: vi.fn(() => store.clear()),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mem,
      configurable: true,
    });
    store.clear();
  });

  it('primaryReportStorageBase prefers id over nombre', () => {
    expect(primaryReportStorageBase({ id: 'x', nombre: 'y' })).toBe('x');
    expect(primaryReportStorageBase({ nombre: 'y' })).toBe('y');
    expect(primaryReportStorageBase({})).toBe('tmp');
  });

  it('reportStorageBaseCandidates lists secondary when id and nombre differ', () => {
    expect(reportStorageBaseCandidates({ id: 'a', nombre: 'b' })).toEqual(['a', 'b']);
    expect(reportStorageBaseCandidates({ nombre: 'only' })).toEqual(['only']);
  });

  it('getReportWeekStoredJSON reads canonical key when present', () => {
    const iso = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10'];
    const suffix = iso.join('_');
    storage.setJSON(`reportes_proj-id_${suffix}`, { G__Ana: {} });

    const data = getReportWeekStoredJSON({ id: 'proj-id', nombre: 'Film' }, iso);
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  it('getReportWeekStoredJSON falls back when canonical key is absent', () => {
    const iso = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10'];
    const suffix = iso.join('_');
    storage.setJSON(`reportes_Old Name_${suffix}`, { G__Bob: { x: 1 } });

    const data = getReportWeekStoredJSON({ id: 'new-id', nombre: 'Old Name' }, iso);
    expect(data).toEqual({ 'G__Bob': { x: 1 } });
  });

  it('getReportWeekStoredJSON does not fall back when canonical key exists even if empty', () => {
    const iso = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10'];
    const suffix = iso.join('_');
    storage.setJSON(`reportes_new-id_${suffix}`, {});
    storage.setJSON(`reportes_Legacy_${suffix}`, { G__Bob: { heavy: true } });

    const data = getReportWeekStoredJSON({ id: 'new-id', nombre: 'Legacy' }, iso);
    expect(data).toEqual({});
  });
});
