import { useEffect, useRef } from 'react';
import { AnyRecord } from '@shared/types/common';

interface UseModelSyncProps {
  model: AnyRecord;
  onChange?: (p: AnyRecord) => void;
}

/**
 * Hook to sync model changes with onChange callback
 */
export function useModelSync({ model, onChange }: UseModelSyncProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const payload = { publicidad: model };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);
}

