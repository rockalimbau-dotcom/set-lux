import { useEffect, useRef } from 'react';
import { AnyRecord } from '@shared/types/common';

interface UseModelSyncProps {
  model: AnyRecord;
  onChange?: (p: AnyRecord) => void;
  enabled?: boolean;
}

/**
 * Hook to sync model changes with onChange callback
 */
export function useModelSync({ model, onChange, enabled = true }: UseModelSyncProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const payload = { diario: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [enabled, model]);
}
