import { describe, expect, it } from 'vitest';

import { preserveOrRecalculateHorasExtra } from './dataPreservation';

describe('dataPreservation preserveOrRecalculateHorasExtra', () => {
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

