import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRoster } from './useRoster';

describe('useRoster', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => {
          if (key === 'team_p1') {
            return JSON.stringify({
              base: [{ role: 'E', name: 'Nombre Antiguo' }],
            });
          }
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      configurable: true,
    });
  });

  it('prioritizes project.team over persisted team storage', () => {
    const project = {
      id: 'p1',
      team: {
        base: [{ role: 'E', name: 'Nombre Nuevo' }],
        reinforcements: [],
        prelight: [],
        pickup: [],
      },
    };

    const { result } = renderHook(() => useRoster(project, [], [], [], []));

    expect(result.current.baseRoster).toEqual([{ role: 'E', name: 'Nombre Nuevo' }]);
  });
});
