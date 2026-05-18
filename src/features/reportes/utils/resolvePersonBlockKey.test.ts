import { describe, it, expect } from 'vitest';
import { resolvePersonBlockKey } from './resolvePersonBlockKey';

describe('resolvePersonBlockKey', () => {
  const iso = '2026-05-07';
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

  const findWeekAndDay = () => ({ day });

  it('resolves extra block for person only in second shift', () => {
    const pk = 'SP__Raúl Alimbau';
    expect(resolvePersonBlockKey(pk, iso, findWeekAndDay, undefined, 'base')).toBe('extra:0');
  });

  it('resolves base block for person in base crew', () => {
    const pk = 'G__Ivan Rodriguez';
    expect(resolvePersonBlockKey(pk, iso, findWeekAndDay, undefined, 'base')).toBe('base');
  });
});
