import { useState, useEffect } from 'react';
import { storage } from '@shared/services/localStorage.service';

/**
 * Hook to manage collapsible state for report week
 */
export function useReportCollapsible(persistBase: string) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const val = storage.getJSON<boolean>(`${persistBase}_open`);
      if (val != null) return val === true;
    } catch {}
    return true;
  });

  useEffect(() => {
    try {
      storage.setJSON(`${persistBase}_open`, open);
    } catch {}
  }, [open, persistBase]);

  return { open, setOpen };
}

