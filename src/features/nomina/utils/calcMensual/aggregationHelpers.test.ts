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

  it('creates extra-block storage and row keys for people scheduled in dynamic extra blocks', () => {
    const week = {
      days: [
        {
          refBlocks: [
            {
              list: [{ role: 'E', name: 'Oriol Monguilod', gender: 'male' }],
            },
          ],
          team: [],
          prelight: [],
          pickup: [],
        },
      ],
    };
    const keys = buildUniqueStorageKeys(week, new Set());
    const [[storageKey, entry]] = Array.from(keys.entries());

    expect(storageKey).toBe('E.extra:0__Oriol Monguilod');
    expect(entry.rowKey).toBe('E.extra__Oriol Monguilod');
    expect(entry.displayBlock).toBe('extra');
    expect(entry.matchRole).toBe('E');
  });

  it('preserves roleId metadata for custom roles so payroll can resolve custom prices', () => {
    const week = {
      days: [
        {
          team: [
            {
              role: 'E',
              roleId: 'electric_factura',
              roleLabel: 'Eléctrico factura',
              name: 'Pol Peitx',
              gender: 'male',
            },
          ],
          prelight: [],
          pickup: [],
        },
      ],
    };
    const keys = buildUniqueStorageKeys(week, new Set());
    const entry = Array.from(keys.values())[0];

    expect(entry.roleId).toBe('electric_factura');
    expect(entry.roleLabel).toBe('Eléctrico factura');
  });

  it('uses roleId in the storage key for custom roles so payroll can read report data', () => {
    const week = {
      days: [
        {
          team: [
            {
              role: 'E',
              roleId: 'electric_factura',
              roleLabel: 'Eléctrico factura',
              name: 'Pol Peitx',
            },
          ],
          prelight: [],
          pickup: [],
        },
      ],
    };

    const keys = buildUniqueStorageKeys(week, new Set());
    const [[storageKey]] = Array.from(keys.entries());

    expect(storageKey).toBe('electric_factura__Pol Peitx');
  });

  it('preserves personId metadata for future payroll grouping by person', () => {
    const week = {
      days: [
        {
          team: [
            {
              role: 'E',
              roleId: 'electric_factura',
              roleLabel: 'Eléctrico factura',
              personId: 'person_pol',
              name: 'Pol Peitx',
            },
          ],
          prelight: [],
          pickup: [],
        },
      ],
    };

    const keys = buildUniqueStorageKeys(week, new Set());
    const entry = Array.from(keys.values())[0];

    expect(entry.personId).toBe('person_pol');
  });

  it('creates separate internal row keys for base and custom roles with the same visible role and name', () => {
    const week = {
      days: [
        {
          team: [
            {
              role: 'E',
              roleId: 'electric_default',
              roleLabel: 'Eléctrico/a',
              personId: 'person_pol',
              name: 'Pol Peitx',
            },
            {
              role: 'E',
              roleId: 'electric_factura',
              roleLabel: 'Eléctrico factura',
              personId: 'person_pol',
              name: 'Pol Peitx',
            },
          ],
        },
      ],
    };

    const entries = Array.from(buildUniqueStorageKeys(week, new Set()).values());

    expect(entries).toHaveLength(2);
    expect(entries.map(entry => entry.rowKey)).toEqual([
      'electric_default__Pol Peitx',
      'electric_factura__Pol Peitx',
    ]);
  });
});
