import { useRef, useEffect } from 'react';
import { AnyRecord } from '@shared/types/common';

interface UseMensualModelProps {
  model: AnyRecord;
  onChange?: (payload: AnyRecord) => void;
  enabled?: boolean;
}

/**
 * Hook to handle model changes and emit to parent
 */
export function useMensualModel({ model, onChange, enabled = true }: UseMensualModelProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const payload = { mensual: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [enabled, model]);
}
