import { describe, it, expect } from 'vitest';
import { buildPersonScheduleText, formatScheduleTimeRange } from './personScheduleDisplay';

describe('personScheduleDisplay', () => {
  it('formats time range with en-dash', () => {
    expect(formatScheduleTimeRange('08:45', '20:00')).toBe('08:45–20:00');
  });

  it('uses per-person __schedule__ override over plan block times', () => {
    const iso = '2026-05-07';
    const pk = 'SP__Raúl Alimbau';
    const day = {
      tipo: 'Pruebas cámara',
      start: '08:00',
      end: '19:30',
      crewList: [{ name: 'Ivan Rodriguez', role: 'G' }],
      refBlocks: [
        {
          tipo: 'Carga',
          start: '08:45',
          end: '20:30',
          list: [{ name: 'Raúl Alimbau', role: 'SP' }],
        },
      ],
    };
    const data = {
      __schedule__: {
        [pk]: {
          'extra:0': {
            [iso]: { start: '09:15', end: '18:45' },
          },
        },
      },
    };

    const text = buildPersonScheduleText({
      data,
      findWeekAndDay: () => ({ day }),
      personKey: pk,
      iso,
      rowBlockKey: 'base',
      planScheduleForBlock: () => '08:45–20:30',
    });

    expect(text).toBe('09:15–18:45');
  });
});
