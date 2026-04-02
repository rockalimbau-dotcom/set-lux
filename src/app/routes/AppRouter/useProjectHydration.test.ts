import { describe, expect, it } from 'vitest';

import { normalizeHydratedProject } from './useProjectHydration';

describe('useProjectHydration helpers', () => {
  it('normalizes hydrated legacy projects before activation', () => {
    const project = normalizeHydratedProject({
      id: 'p1',
      nombre: 'Demo',
      estado: 'Activo',
    } as any);

    expect(project?.roleCatalog?.roles?.length).toBeGreaterThan(0);
  });
});
