import { useState, useEffect } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { loadCondModel } from '../../utils/cond';

/**
 * Hook para sincronizar cambios en condiciones de diario
 */
export function useCondSync(project: any, baseId: string) {
  const condKeys = [`cond_${baseId}_diario`];

  const [condStamp, setCondStamp] = useState<string>(() =>
    condKeys.map(k => storage.getString(k) || '').join('|')
  );

  useEffect(() => {
    // Garantizar que exista la clave de condiciones de diario en localStorage
    try {
      const cur = storage.getString(condKeys[0]);
      if (!cur) {
        // Esto fuerza la siembra y persistencia inmediata si no existe
        loadCondModel(project);
        const after = storage.getString(condKeys[0]) || '';
        if (after) setCondStamp(after);
      }
    } catch {}

    const tick = () => {
      const cur = condKeys.map(k => storage.getString(k) || '').join('|');
      setCondStamp(prev => {
        // Solo actualizar si realmente cambió
        if (prev === cur) return prev;
        return cur;
      });
    };
    const onFocus = () => tick();
    const onStorage = (e: StorageEvent) => {
      if (e && e.key && condKeys.includes(e.key)) tick();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    // Aumentar intervalo a 3 segundos para reducir carga
    const id = setInterval(tick, 3000);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [baseId, project]);

  return condStamp;
}

