import { describe, expect, it } from 'vitest';

import { shouldSyncProjectMetadata } from './useProjectStorage';

describe('useProjectStorage helpers', () => {
  it('detects roleCatalog changes as project metadata updates', () => {
    const prev = {
      id: 'p1',
      nombre: 'Demo',
      estado: 'Activo',
      roleCatalog: {
        version: 1,
        roles: [{ id: 'gaffer_default', label: 'Gaffer', sortOrder: 0, active: true, supportsPrelight: true, supportsPickup: true, supportsRefuerzo: true }],
      },
      conditions: { tipo: 'semanal' },
    } as any;

    const next = {
      ...prev,
      roleCatalog: {
        version: 1,
        roles: [
          ...prev.roleCatalog.roles,
          { id: 'electric_premium', label: 'Eléctrico premium', sortOrder: 1, active: true, supportsPrelight: true, supportsPickup: true, supportsRefuerzo: true },
        ],
      },
    };

    expect(shouldSyncProjectMetadata(next, prev)).toBe(true);
  });

  it('detects deep conditions changes, not only tipo', () => {
    const prev = {
      id: 'p1',
      nombre: 'Demo',
      estado: 'Activo',
      conditions: {
        tipo: 'diario',
        diario: {
          roles: ['gaffer_default', 'electric_default'],
          prices: {
            gaffer_default: { 'Precio jornada': '510' },
            electric_default: { 'Precio jornada': '310' },
          },
        },
      },
    } as any;

    const next = {
      ...prev,
      conditions: {
        ...prev.conditions,
        diario: {
          roles: ['gaffer_default', 'electric_default', 'electric_x'],
          prices: {
            ...prev.conditions.diario.prices,
            electric_x: { 'Precio jornada': '777' },
          },
        },
      },
    } as any;

    expect(shouldSyncProjectMetadata(next, prev)).toBe(true);
  });
});
