import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRoster } from './useRoster';

describe('useRoster', () => {
  it('enriches roster members with roleLabel from the project role catalog', () => {
    const project = {
      id: 'p1',
      nombre: 'Proyecto',
      roleCatalog: {
        version: 1 as const,
        roles: [
          {
            id: 'e_default',
            label: 'Eléctrico/a',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 1,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
          {
            id: 'e_factura',
            label: 'Eléctrico factura',
            legacyCode: 'E',
            baseRole: 'E',
            sortOrder: 1,
            active: true,
            supportsPrelight: true,
            supportsPickup: true,
            supportsRefuerzo: true,
          },
        ],
      },
      team: {
        base: [
          { role: 'E', roleId: 'e_default', name: 'ricard durany' },
          { role: 'E', roleId: 'e_factura', name: 'pol peitx' },
        ],
      },
    };

    const { result } = renderHook(() => useRoster(project, [], [], [], []));

    expect(result.current.baseRoster).toEqual([
      { role: 'E', roleId: 'e_default', roleLabel: 'Eléctrico/a', name: 'ricard durany' },
      { role: 'E', roleId: 'e_factura', roleLabel: 'Eléctrico factura', name: 'pol peitx' },
    ]);
  });
});
