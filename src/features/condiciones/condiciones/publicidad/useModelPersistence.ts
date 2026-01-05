import { useEffect, useRef } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { AnyRecord } from '@shared/types/common';

interface UseModelPersistenceProps {
  storageKey: string;
  model: AnyRecord;
}

/**
 * Hook to persist initial model to localStorage if it doesn't exist,
 * so Nomina can recognize it without needing to edit fields.
 */
export function useModelPersistence({ storageKey, model }: UseModelPersistenceProps) {
  const wroteInitialRef = useRef(false);
  
  useEffect(() => {
    if (wroteInitialRef.current) return;
    try {
      const existing = storage.getJSON<any>(storageKey);
      if (!existing) {
        storage.setJSON(storageKey, model);
      }
    } catch {}
    wroteInitialRef.current = true;
  }, [storageKey, model]);
}

