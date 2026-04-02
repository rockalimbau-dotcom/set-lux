import { describe, expect, it } from 'vitest';

import { formatMemberDropdownOptionLabel, mergeMemberIntoList } from './MembersRow';

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

  it('keeps different custom roles with same name separated by roleId', () => {
    const current = [{ role: 'E', roleId: 'electric_day', name: 'Juan', source: 'base' }];

    const next = mergeMemberIntoList(
      current,
      { role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Juan', source: 'base' },
      sortMemberList
    );

    expect(next).toEqual([
      { role: 'E', roleId: 'electric_day', name: 'Juan', source: 'base' },
      {
        role: 'E',
        roleId: 'electric_night',
        roleLabel: 'Eléctrico noche',
        name: 'Juan',
        gender: undefined,
        source: 'base',
        rosterManaged: false,
      },
    ]);
  });

  it('preserves personId when adding a member from the dropdown', () => {
    const next = mergeMemberIntoList(
      [],
      { role: 'E', roleId: 'electric_factura', personId: 'person_pol', roleLabel: 'Eléctrico factura', name: 'Pol Peitx', source: 'base' },
      sortMemberList
    );

    expect(next).toEqual([
      {
        personId: 'person_pol',
        role: 'E',
        roleId: 'electric_factura',
        roleLabel: 'Eléctrico factura',
        name: 'Pol Peitx',
        gender: undefined,
        source: 'base',
        rosterManaged: false,
      },
    ]);
  });
});

describe('formatMemberDropdownOptionLabel', () => {
  it('adds the custom role label to distinguish duplicate people in the dropdown', () => {
    const baseLabel = formatMemberDropdownOptionLabel(
      { role: 'E', roleId: 'e_default', roleLabel: 'Eléctrico/a', name: 'Pol Peitx', gender: 'neutral' },
      undefined,
      'es'
    );
    const customLabel = formatMemberDropdownOptionLabel(
      { role: 'E', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', name: 'Pol Peitx', gender: 'male' },
      undefined,
      'es'
    );

    expect(baseLabel).toBe('E · Pol Peitx');
    expect(customLabel).toBe('E · Pol Peitx — Eléctrico factura');
    expect(baseLabel).not.toBe(customLabel);
  });

  it('keeps the source suffix badge for prelight and pickup contexts', () => {
    const label = formatMemberDropdownOptionLabel(
      { role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Pol Peitx', source: 'pre', gender: 'male' },
      'prelight',
      'es'
    );

    expect(label).toBe('EP · Pol Peitx — Eléctrico noche');
  });
});
