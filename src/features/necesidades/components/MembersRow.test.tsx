import { describe, expect, it } from 'vitest';

import { mergeMemberIntoList } from './MembersRow';

describe('mergeMemberIntoList', () => {
  const sortMemberList = <T,>(items: T[]) => items;

  it('replaces an existing member when the same name is selected with a different role', () => {
    const current = [{ role: 'G', name: 'Juan', source: 'base' }];

    const next = mergeMemberIntoList(
      current,
      { role: 'BB', name: 'Juan', source: 'base' },
      sortMemberList
    );

    expect(next).toEqual([{ role: 'BB', name: 'Juan', gender: undefined, source: 'base', rosterManaged: false }]);
  });

  it('keeps the list unchanged when selecting the exact same role and name', () => {
    const current = [{ role: 'G', name: 'Juan', source: 'base' }];

    const next = mergeMemberIntoList(
      current,
      { role: 'G', name: 'Juan', source: 'base' },
      sortMemberList
    );

    expect(next).toBe(current);
  });
});
