import { describe, expect, it } from 'vitest';

import { validateTeamNames } from './ProjectDetailUtils';

describe('ProjectDetailUtils', () => {
  it('uses roleLabel in name validation when available', () => {
    const result = validateTeamNames({
      base: [{ role: 'E', roleId: 'electric_premium', roleLabel: 'Eléctrico premium', name: '' }],
      reinforcements: [],
      prelight: [],
      pickup: [],
      enabledGroups: { prelight: false, pickup: false },
    });

    expect(result).toEqual({
      role: 'Eléctrico premium',
      group: 'base',
    });
  });
});
