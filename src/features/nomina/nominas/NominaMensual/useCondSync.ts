import { useState, useEffect } from 'react';
import { storage } from '@shared/services/localStorage.service';

/**
 * Hook para sincronizar cambios en condiciones de mensual
 */
export function useCondSync(baseId: string) {
  const condKeys = [`cond_${baseId}_mensual`];

  const [condStamp, setCondStamp] = useState<string>(() =>
    condKeys.map(k => storage.getString(k) || '').join('|')
  );

  useEffect(() => {
    const tick = () => {
      const cur = condKeys.map(k => storage.getString(k) || '').join('|');
      setCondStamp(prev => (prev === cur ? prev : cur));
    };
    const onFocus = () => tick();
    const onStorage = (e: StorageEvent) => {
      if (e && e.key && condKeys.includes(e.key)) tick();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    const id = setInterval(tick, 1000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [baseId]);

  return condStamp;
}

