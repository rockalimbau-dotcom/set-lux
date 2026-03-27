import { describe, expect, it } from 'vitest';

import { syncDayListWithRosterBlankOnly } from './rosterSync';

describe('syncDayListWithRosterBlankOnly', () => {
  it('fills blank names from the roster for the same role', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: '', source: 'base' }],
      [{ role: 'E', name: 'Electrico X', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'Electrico X', source: 'base', gender: 'male', rosterManaged: true },
    ]);
  });

  it('updates a roster-managed member when the team name changes', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: 'Electrico X', source: 'base', gender: 'male', rosterManaged: true }],
      [{ role: 'E', name: 'Electrico Z', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'Electrico Z', source: 'base', gender: 'male', rosterManaged: true },
    ]);
  });

  it('replaces a name when that role no longer exists in the current roster', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: 'Electrico A', source: 'base', gender: 'male', rosterManaged: false }],
      [{ role: 'E', name: 'Electrico X', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'Electrico X', source: 'base', gender: 'male', rosterManaged: true },
    ]);
  });

  it('replaces a legacy name that no longer exists in the current roster', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: 'papapapapapapa', source: 'base', gender: 'neutral', rosterManaged: false }],
      [
        { role: 'E', name: 'aaaa', gender: 'neutral' },
        { role: 'E', name: 'nanananaa', gender: 'neutral' },
      ],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'aaaa', source: 'base', gender: 'neutral', rosterManaged: true },
    ]);
  });
});
