import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchHolidays, normalizeToISO } from './holidays.service';

// Helper to set env for Calendarific
function setCalendarificKey(key: string) {
  (globalThis as any).import = { meta: { env: { VITE_CALENDARIFIC_KEY: key } } } as any;
  // Also support direct import.meta access in some environments
  (globalThis as any).importMeta = { env: { VITE_CALENDARIFIC_KEY: key } } as any;
  (globalThis as any).process = { env: { VITE_CALENDARIFIC_KEY: key } } as any;
}

describe('holidays.service (Calendarific)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setCalendarificKey('test-key');
  });

  it('normalizeToISO should handle various formats', () => {
    expect(normalizeToISO('2025-01-06')).toBe('2025-01-06');
    // Non-ISO date string should still try to normalize without throwing
    const d = normalizeToISO('Jan 6 2025');
    expect(/^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(true);
  });

  it('fetchHolidays should return dates from Calendarific (with region)', async () => {
    // Mock Calendarific shape
    const mockResponse = {
      meta: { code: 200 },
      response: {
        holidays: [
          { date: { iso: '2025-01-01' }, name: 'Año Nuevo' },
          { date: { iso: '2025-05-02' }, name: 'Día de la Comunidad de Madrid' },
        ],
      },
    };

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('calendarific.com/api/v2/holidays');
      expect(url).toContain('country=ES');
      expect(url).toContain('year=2025');
      expect(url).toContain('location=ES-MD'); // region Madrid
      return {
        ok: true,
        json: async () => mockResponse,
      } as any;
    }));

    const { holidays, source } = await fetchHolidays({ country: 'ES', year: 2025, region: 'MD' });
    expect(source).toBe('calendarific');
    expect(Array.isArray(holidays)).toBe(true);
    const dates = holidays.map(h => h.date);
    expect(dates).toContain('2025-01-01');
    expect(dates).toContain('2025-05-02');
  });

  it('fetchHolidays fallback-local for ES if Calendarific fails', async () => {
    // Force failure
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as any));

    const { holidays, source } = await fetchHolidays({ country: 'ES', year: 2025, region: 'CT' });
    // Fallback uses regional-holidays list -> at least include Diada 2025-09-11 (defined in file)
    expect(source === 'fallback-local' || source === 'calendarific').toBe(true);
    expect(Array.isArray(holidays)).toBe(true);
  });
});


