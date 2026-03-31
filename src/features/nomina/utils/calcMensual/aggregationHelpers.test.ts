import { describe, expect, it } from 'vitest';

import { buildUniqueStorageKeys, visibleRoleFor } from './aggregationHelpers';

describe('payroll mensual visibleRoleFor', () => {
  it('keeps base role for base-source member scheduled in prelight', () => {
    expect(visibleRoleFor('EP', 'Ricard Durany', new Set(), 'base')).toBe('E');
  });

  it('creates a separate internal row key for base crew working in pickup', () => {
    const week = {
      days: [
        {
          team: [],
          prelight: [],
          pickup: [{ role: 'ER', name: 'Ricard Durany', source: 'base' }],
        },
      ],
    };
    const keys = buildUniqueStorageKeys(week, new Set());
    const entry = Array.from(keys.values())[0];
    expect(entry.rowKey).toBe('E.pick__Ricard Durany');
    expect(entry.displayBlock).toBe('pick');
    expect(entry.matchRole).toBe('ER');
  });
});
