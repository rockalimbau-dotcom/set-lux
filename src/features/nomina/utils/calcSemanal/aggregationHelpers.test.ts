import { describe, expect, it } from 'vitest';

import { buildUniqueStorageKeys, visibleRoleFor } from './aggregationHelpers';

describe('visibleRoleFor', () => {
  it('keeps base role for base-source member scheduled in prelight', () => {
    expect(visibleRoleFor('EP', 'Ricard Durany', new Set(), 'base')).toBe('E');
  });

  it('keeps prelight role for dedicated prelight crew', () => {
    expect(visibleRoleFor('EP', 'Oriol Monguilod', new Set(), 'pre')).toBe('EP');
  });

  it('keeps pickup role for dedicated pickup crew', () => {
    expect(visibleRoleFor('ER', 'Ricard Durany', new Set(), 'pick')).toBe('ER');
  });

  it('creates a separate internal row key for base crew working in prelight', () => {
    const week = {
      days: [
        {
          prelight: [{ role: 'EP', name: 'Ricard Durany', source: 'base' }],
          team: [],
          pickup: [],
        },
      ],
    };
    const keys = buildUniqueStorageKeys(week, new Set());
    const entry = Array.from(keys.values())[0];
    expect(entry.rowKey).toBe('E.pre__Ricard Durany');
    expect(entry.displayBlock).toBe('pre');
    expect(entry.matchRole).toBe('EP');
  });
});
