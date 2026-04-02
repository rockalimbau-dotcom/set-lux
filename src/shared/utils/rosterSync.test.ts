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

  it('keeps an existing scheduled member when the roster changes by composition', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: 'Electrico X', source: 'base', gender: 'male', rosterManaged: true }],
      [{ role: 'E', name: 'Electrico Z', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'Electrico X', source: 'base', gender: 'male', rosterManaged: true },
    ]);
  });

  it('preserves a manual name even if another person with the same role exists', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: 'Electrico A', source: 'base', gender: 'male', rosterManaged: false }],
      [{ role: 'E', name: 'Electrico X', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      { role: 'E', name: 'Electrico A', source: 'base', gender: 'male', rosterManaged: false },
    ]);
  });

  it('propagates roleId and roleLabel from the roster when filling a blank slot', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: '', source: 'base' }],
      [{ role: 'E', roleId: 'electric_premium', roleLabel: 'Eléctrico premium', name: 'Electrico X', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      {
        role: 'E',
        roleId: 'electric_premium',
        roleLabel: 'Eléctrico premium',
        name: 'Electrico X',
        source: 'base',
        gender: 'male',
        rosterManaged: true,
      },
    ]);
  });

  it('matches blank slots by roleId before legacy role when custom roles share the same code', () => {
    const result = syncDayListWithRosterBlankOnly(
      [
        { role: 'E', roleId: 'electric_day', name: '', source: 'base' },
        { role: 'E', roleId: 'electric_night', name: '', source: 'base' },
      ],
      [
        { role: 'E', roleId: 'electric_night', roleLabel: 'Eléctrico noche', name: 'Ana', gender: 'female' },
        { role: 'E', roleId: 'electric_day', roleLabel: 'Eléctrico día', name: 'Berta', gender: 'female' },
      ],
      'base'
    );

    expect(result).toEqual([
      {
        role: 'E',
        roleId: 'electric_day',
        roleLabel: 'Eléctrico día',
        name: 'Berta',
        source: 'base',
        gender: 'female',
        rosterManaged: true,
      },
      {
        role: 'E',
        roleId: 'electric_night',
        roleLabel: 'Eléctrico noche',
        name: 'Ana',
        source: 'base',
        gender: 'female',
        rosterManaged: true,
      },
    ]);
  });

  it('propagates personId from the roster when filling or refreshing a slot', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', name: '', source: 'base' }],
      [{ role: 'E', personId: 'person_pol', name: 'Pol Peitx', gender: 'male' }],
      'base'
    );

    expect(result).toEqual([
      {
        role: 'E',
        personId: 'person_pol',
        name: 'Pol Peitx',
        source: 'base',
        gender: 'male',
        rosterManaged: true,
      },
    ]);
  });

  it('matches slots by roleId before personId when the same person has multiple tariffs', () => {
    const result = syncDayListWithRosterBlankOnly(
      [
        { role: 'E', personId: 'person_day', roleId: 'electric_day', name: '', source: 'base' },
        { role: 'E', personId: 'person_night', roleId: 'electric_night', name: '', source: 'base' },
      ],
      [
        { role: 'E', personId: 'person_night', roleId: 'electric_day', name: 'Pol Peitx', gender: 'male' },
        { role: 'E', personId: 'person_day', roleId: 'electric_night', name: 'Pol Peitx', gender: 'male' },
      ],
      'base'
    );

    expect(result[0]?.personId).toBe('person_night');
    expect(result[0]?.roleId).toBe('electric_day');
    expect(result[0]?.name).toBe('Pol Peitx');
    expect(result[1]?.personId).toBe('person_day');
    expect(result[1]?.roleId).toBe('electric_night');
    expect(result[1]?.name).toBe('Pol Peitx');
  });

  it('does not overwrite a custom tariff with the base one just because personId matches', () => {
    const result = syncDayListWithRosterBlankOnly(
      [{ role: 'E', personId: 'person_pol', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', name: 'Pol Peitx', source: 'base', rosterManaged: true }],
      [
        { role: 'E', personId: 'person_pol', roleId: 'e_default', roleLabel: 'Eléctrico/a', name: 'Pol Peitx', gender: 'male' },
        { role: 'E', personId: 'person_pol', roleId: 'electric_factura', roleLabel: 'Eléctrico factura', name: 'Pol Peitx', gender: 'male' },
      ],
      'base'
    );

    expect(result).toEqual([
      {
        role: 'E',
        personId: 'person_pol',
        roleId: 'electric_factura',
        roleLabel: 'Eléctrico factura',
        name: 'Pol Peitx',
        source: 'base',
        rosterManaged: true,
      },
    ]);
  });
});
