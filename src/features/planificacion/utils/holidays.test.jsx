import { describe, it, expect, vi } from 'vitest';
import { extractHolidaySets } from './holidays.ts';

// Mock constants
vi.mock('../constants', () => ({
  mdKey: vi.fn((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
}));

describe('planificacion/utils/holidays', () => {
  describe('extractHolidaySets', () => {
    it('extracts full dates from festivosDates arrays', () => {
      const conditions = {
        festivosDates: ['2023-01-01', '2023-12-25'],
        mensual: {
          festivosDates: ['2023-04-14'],
        },
        semanal: {
          festivosDates: ['2023-05-01'],
        },
        publicidad: {
          festivosDates: ['2023-08-15'],
        },
      };

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-01-01');
      expect(result.full).toContain('2023-12-25');
      expect(result.full).toContain('2023-04-14');
      expect(result.full).toContain('2023-05-01');
      expect(result.full).toContain('2023-08-15');
      expect(result.full.size).toBe(5);
    });

    it('extracts MD dates from festivosDates arrays', async () => {
      const conditions = {
        festivosDates: ['01/01', '12/25'],
        mensual: {
          festivosDates: ['04/14'],
        },
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(mdKey).toHaveBeenCalledWith(1, 1);
      expect(mdKey).toHaveBeenCalledWith(25, 12);
      expect(mdKey).toHaveBeenCalledWith(14, 4);
      expect(result.md.size).toBe(3);
    });

    it('extracts dates with 2-digit years', () => {
      const conditions = {
        festivosDates: ['01/01/23', '25/12/23'],
      };

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-01-01');
      expect(result.full).toContain('2023-12-25');
    });

    it('extracts dates with 4-digit years', () => {
      const conditions = {
        festivosDates: ['01/01/2023', '25/12/2023'],
      };

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-01-01');
      expect(result.full).toContain('2023-12-25');
    });

    it('extracts dates in YYYY-MM-DD format', () => {
      const conditions = {
        festivosDates: ['2023-01-01', '2023-12-25'],
      };

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-01-01');
      expect(result.full).toContain('2023-12-25');
    });

    it('extracts dates with different separators', async () => {
      const conditions = {
        festivosDates: ['01-01', '25-12'],
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(mdKey).toHaveBeenCalledWith(1, 1);
      expect(mdKey).toHaveBeenCalledWith(12, 25);
      expect(result.md.size).toBe(2);
    });

    it('extracts dates from template texts', async () => {
      const conditions = {
        festivosTemplate: 'Fiestas: 01/01, 25/12, 14/04',
        mensual: {
          festivosTemplate: 'Navidad: 25/12/2023',
        },
        semanal: {
          festivosTemplate: 'Año Nuevo: 1/1/23',
        },
        publicidad: {
          festivosTemplate: 'Verano: 15-08',
        },
        festivos: 'Día del Trabajo: 1/5',
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-12-25');
      expect(result.full).toContain('2023-01-01');
      expect(result.md).toContain('01-01');
      expect(result.md).toContain('12-25');
      expect(result.md).toContain('04-14');
      expect(result.md).toContain('08-15');
      expect(result.md).toContain('05-01');
    });

    it('normalizes text with special characters', async () => {
      const conditions = {
        festivosTemplate: 'Fiestas: 01/01\u00A0, 25–12, 14·04',
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(mdKey).toHaveBeenCalledWith(1, 1);
      expect(mdKey).toHaveBeenCalledWith(25, 12);
      expect(mdKey).toHaveBeenCalledWith(14, 4);
      expect(result.md.size).toBe(2);
    });

    it('handles empty conditions', () => {
      const conditions = {};

      const result = extractHolidaySets(conditions);

      expect(result.full.size).toBe(0);
      expect(result.md.size).toBe(0);
    });

    it('handles null/undefined values', () => {
      const conditions = {
        festivosDates: null,
        mensual: {
          festivosDates: undefined,
        },
        festivosTemplate: null,
        festivos: undefined,
      };

      const result = extractHolidaySets(conditions);

      expect(result.full.size).toBe(0);
      expect(result.md.size).toBe(0);
    });

    it('handles mixed date formats in same array', async () => {
      const conditions = {
        festivosDates: ['2023-01-01', '02/01', '04/03/2023', '06-05'],
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-01-01');
      expect(result.full).toContain('2023-03-04');
      expect(mdKey).toHaveBeenCalledWith(1, 2);
      expect(mdKey).toHaveBeenCalledWith(5, 6);
      expect(result.full.size).toBe(2);
      expect(result.md.size).toBe(2);
    });

    it('handles complex template text with multiple dates', async () => {
      const conditions = {
        festivosTemplate: 'Navidad: 25/12/2023, Año Nuevo: 1/1/24, Reyes: 6/1, Verano: 15-08',
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(result.full).toContain('2023-12-25');
      expect(result.full).toContain('2024-01-01');
      expect(mdKey).toHaveBeenCalledWith(1, 6);
      expect(mdKey).toHaveBeenCalledWith(8, 15);
      expect(result.full.size).toBe(2);
      expect(result.md.size).toBe(2);
    });

    it('handles invalid date formats gracefully', () => {
      const conditions = {
        festivosDates: ['invalid', '2023-13-45', '32/12', ''],
        festivosTemplate: 'Invalid: abc, def, 123',
      };

      const result = extractHolidaySets(conditions);

      // '2023-13-45' matches YYYY-MM-DD pattern (even though invalid)
      // '32/12' matches DD/MM pattern and becomes '12-32'
      expect(result.full.size).toBe(1);
      expect(result.md.size).toBe(1);
      expect(result.full).toContain('2023-13-45');
      expect(result.md).toContain('12-32');
    });

    it('handles whitespace in date strings', async () => {
      const conditions = {
        festivosDates: [' 01/01 ', ' 25/12 '],
        festivosTemplate: ' Dates: 1/1 , 25/12 ',
      };

      const { mdKey } = vi.mocked(await import('../constants'));
      mdKey.mockImplementation((m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

      const result = extractHolidaySets(conditions);

      expect(mdKey).toHaveBeenCalledWith(1, 1);
      expect(mdKey).toHaveBeenCalledWith(25, 12);
      expect(result.md.size).toBe(2);
    });
  });
});
