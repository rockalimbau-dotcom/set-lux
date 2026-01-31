import { useEffect, useState } from 'react';
import { fetchHolidays } from '@shared/services/holidays.service';
import { mdKey } from '@shared/utils/dateKey';

export function useHolidays(country: string, region: string) {
  const [holidayFull, setHolidayFull] = useState<Set<string>>(new Set());
  const [holidayMD, setHolidayMD] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const year = new Date().getFullYear();
        const { holidays } = await fetchHolidays({
          country,
          year,
          region: region || undefined,
        });
        const dates = (holidays || []).map(h => String(h.date));
        const full = new Set<string>(dates);
        const md = new Set<string>();
        for (const ymd of full) {
          const [y, m, d] = ymd.split('-').map(Number);
          if (y && m && d) md.add(mdKey(m, d));
        }
        if (!alive) return;
        setHolidayFull(full);
        setHolidayMD(md);
      } catch {
        if (!alive) return;
        setHolidayFull(new Set());
        setHolidayMD(new Set());
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [country, region]);

  return { holidayFull, holidayMD };
}
