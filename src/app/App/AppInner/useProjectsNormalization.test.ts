import { describe, expect, it } from 'vitest';

import { shouldNormalizeProjects } from './useProjectsNormalization';

describe('useProjectsNormalization helpers', () => {
  it('detects legacy projects missing roleCatalog or region metadata', () => {
    expect(shouldNormalizeProjects([
      { id: '1', nombre: 'Demo', estado: 'Activo' as const },
    ])).toBe(true);
  });

  it('does not normalize projects that already have region and roleCatalog', () => {
    expect(shouldNormalizeProjects([
      {
        id: '1',
        nombre: 'Demo',
        estado: 'Activo' as const,
        country: 'ES',
        region: 'CT',
        roleCatalog: {
          version: 1,
          roles: [{ id: 'gaffer_default', label: 'Gaffer', sortOrder: 0, active: true, supportsPrelight: true, supportsPickup: true, supportsRefuerzo: true }],
        },
      },
    ])).toBe(false);
  });
});
