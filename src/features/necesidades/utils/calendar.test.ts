import { describe, expect, it } from 'vitest';

import { relabelNeedsWeekByCalendar } from './calendar';

describe('relabelNeedsWeekByCalendar', () => {
  it('sets Rodaje Festivo on holidays when crewTipo is Rodaje', () => {
    const week = {
      startDate: '2026-05-04',
      days: [{ crewTipo: 'Rodaje' }],
    };

    const result = relabelNeedsWeekByCalendar(
      week,
      '2026-05-04',
      new Set(['2026-05-04']),
      new Set()
    );

    expect(result.days[0].crewTipo).toBe('Rodaje Festivo');
  });

  it('keeps manual crewTipo override on holidays', () => {
    const week = {
      startDate: '2026-05-04',
      days: [{ crewTipo: 'Rodaje', manualTipo: true }],
    };

    const result = relabelNeedsWeekByCalendar(
      week,
      '2026-05-04',
      new Set(['2026-05-04']),
      new Set()
    );

    expect(result.days[0].crewTipo).toBe('Rodaje');
  });
});
