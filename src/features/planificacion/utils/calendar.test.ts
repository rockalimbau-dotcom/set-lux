import { describe, it, expect } from 'vitest';
import { relabelWeekByCalendar, relabelWeekByCalendarDynamic } from './calendar';

function makeWeek(startDate: string, tipos?: Array<string | undefined>) {
  const days = new Array(7).fill(null).map((_, i) => ({ tipo: tipos?.[i] }));
  return { startDate, days } as any;
}

describe('calendar relabel', () => {
  it('marks holiday as Rodaje Festivo when date is in holiday sets', () => {
    const week = makeWeek('2025-09-08', [undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    const full = new Set<string>(['2025-09-11']); // Thursday (Cataluña example)
    const md = new Set<string>();

    const relabeled = relabelWeekByCalendar(week, '2025-09-08', full, md);
    // Index 3 is Thursday from Monday start: Mon(0) Tue(1) Wed(2) Thu(3)
    expect(relabeled.days[3].tipo).toBe('Rodaje Festivo');
  });

  it('reverts Rodaje Festivo to Rodaje when holiday removed', () => {
    // Start with a week where a day is already festivo
    const week = makeWeek('2025-09-08', ['Rodaje', 'Rodaje Festivo', 'Rodaje', 'Rodaje', 'Rodaje', 'Rodaje', 'Rodaje']);
    const full = new Set<string>(); // no holidays now
    const md = new Set<string>();

    const relabeled = relabelWeekByCalendar(week, '2025-09-08', full, md);
    expect(relabeled.days[1].tipo).toBe('Rodaje');
  });

  it('respects manual override (manualTipo) and does not change tipo', async () => {
    const week = makeWeek('2025-03-10');
    // Mark Wednesday as manual override to Rodaje although it is a holiday
    (week.days[2] as any).tipo = 'Rodaje';
    (week.days[2] as any).manualTipo = true;

    const full = new Set<string>(['2025-03-12']); // Wednesday
    const md = new Set<string>();

    const relabeled = await relabelWeekByCalendarDynamic(week, '2025-03-10', full, md);
    expect(relabeled.days[2].tipo).toBe('Rodaje'); // unchanged
  });

  it('sets Descanso on weekends when tipo is not set', () => {
    const week = makeWeek('2025-03-10', [undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    const full = new Set<string>();
    const md = new Set<string>();

    const relabeled = relabelWeekByCalendar(week, '2025-03-10', full, md);
    // Saturday index 5, Sunday index 6
    expect(relabeled.days[5].tipo).toBe('Descanso');
    expect(relabeled.days[6].tipo).toBe('Descanso');
  });
});


