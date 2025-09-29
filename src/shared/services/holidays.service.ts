import { storage } from './localStorage.service';
import { getRegionalHolidayDates } from '@shared/constants/regional-holidays';

export type Holiday = { date: string; localName?: string; name?: string };

export type HolidaySource = 'calendarific' | 'fallback-local' | 'none';

export interface HolidayQuery {
  country: string; // ISO 3166-1 alpha-2, e.g., ES, FR
  year: number; // 2025
  region?: string; // optional region code (e.g., CT for Catalunya)
}

interface FetchResult {
  source: HolidaySource;
  holidays: Holiday[];
}

const CACHE_PREFIX = 'holidays_v1';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function cacheKey({ country, year, region }: HolidayQuery): string {
  const reg = region ? `_${region}` : '';
  return `${CACHE_PREFIX}_${country}_${year}${reg}`;
}

export function normalizeToISO(dateStr: string): string {
  // Accepts YYYY-MM-DD or other common formats; returns YYYY-MM-DD
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    if (!isFinite(y)) throw new Error('Invalid date');
    return `${y}-${m}-${dd}`;
  } catch {
    return dateStr;
  }
}

async function fetchFromCalendarific({ country, year, region }: HolidayQuery): Promise<FetchResult> {
  const apiKey = (import.meta as any)?.env?.VITE_CALENDARIFIC_KEY as string | undefined;
  if (!apiKey) {
    console.warn('Calendarific API key missing (VITE_CALENDARIFIC_KEY)');
    return { source: 'none', holidays: [] };
  }

  // Calendarific supports `location` for ISO 3166-2 codes (e.g., ES-CT)
  const params = new URLSearchParams({
    api_key: apiKey,
    country,
    year: String(year),
  });
  if (region) params.set('location', `${country}-${region}`);

  const url = `https://calendarific.com/api/v2/holidays?${params.toString()}`;

  try {
    console.log(`🌍 Calendarific → ${url}`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Calendarific failed: ${resp.status}`);
    const data = (await resp.json()) as {
      meta?: { code?: number };
      response?: { holidays?: Array<{ date?: { iso?: string }; name?: string; description?: string; }>; };
    };
    const rows = data?.response?.holidays || [];
    const holidays: Holiday[] = rows
      .map(h => ({
        date: normalizeToISO(h?.date?.iso || ''),
        name: h?.name || 'Festivo',
        localName: h?.name || 'Festivo',
      }))
      .filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log(`✅ Calendarific ${country}${region ? '-' + region : ''} ${year}:`, holidays.map(h => h.date).slice(0, 5));
    return { source: 'calendarific', holidays };
  } catch (error) {
    console.warn('❌ Calendarific error:', error);
    return { source: 'none', holidays: [] };
  }
}

export async function fetchHolidays(query: HolidayQuery): Promise<FetchResult> {
  const key = cacheKey(query);
  try {
    const cached = storage.getJSON<any>(key);
    if (cached && Array.isArray(cached.holidays) && cached.expiresAt > Date.now()) {
      return cached as FetchResult;
    }
  } catch {}

  const { country, year, region } = query;

  // Principal: Calendarific con location (si hay región)
  let result = await fetchFromCalendarific({ country, year, region });

  // Fallback local mínimo para ES si Calendarific falla
  if (result.source === 'none' && country === 'ES') {
    const regionalDates = getRegionalHolidayDates(country, region || null, year);
    const holidays: Holiday[] = regionalDates.map(d => ({ date: d }));
    result = { source: 'fallback-local', holidays };
  }

  // Persist with 24h TTL
  try {
    storage.setJSON(key, { ...result, expiresAt: Date.now() + ONE_DAY_MS });
  } catch {}

  return result;
}

export async function getHolidaySet(query: HolidayQuery): Promise<Set<string>> {
  const { holidays } = await fetchHolidays(query);
  return new Set((holidays || []).map(h => h.date));
}

export function readLocationFromSettings(): { country: string; region?: string } {
  try {
    const s = storage.getJSON<any>('settings_v1') || {};
    const country = s.country || 'ES';
    const region = s.region || undefined;
    return { country, region };
  } catch {
    return { country: 'ES' };
  }
}
