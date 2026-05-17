import { describe, expect, it } from 'vitest';

import { preserveOrRecalculateHorasExtra, preserveOrUseAuto } from './dataPreservation';

describe('dataPreservation preserveOrRecalculateHorasExtra', () => {
  it('clears value when person is off (not on calendar)', () => {
    const result = preserveOrRecalculateHorasExtra({
      sourceState: {},
      pk: 'BB__Test',
      iso: '2026-04-30',
      autoExtra: '3',
      currExtra: '2',
      manualExtra: true,
      horasExtraTipo: 'Hora Extra - Normal',
      horasExtraTipoChanged: false,
      off: true,
    });

    expect(result).toEqual({ value: '', isManual: false });
  });

  it('clears preserveOrUseAuto when off', () => {
    expect(
      preserveOrUseAuto({
        currValue: 'Sí',
        autoValue: 'Sí',
        manual: true,
        off: true,
      })
    ).toBe('');
  });

  it('keeps current value when auto result is empty and manual flag has not arrived yet', () => {
    const result = preserveOrRecalculateHorasExtra({
      sourceState: {},
      pk: 'BB__Test',
      iso: '2026-04-30',
      autoExtra: '',
      currExtra: '2',
      manualExtra: false,
      horasExtraTipo: 'Hora Extra - Normal',
      horasExtraTipoChanged: false,
      off: false,
    });

    expect(result).toEqual({ value: '2', isManual: true });
  });
});

