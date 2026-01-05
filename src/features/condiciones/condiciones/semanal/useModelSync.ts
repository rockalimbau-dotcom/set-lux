import { useEffect, useRef } from 'react';
import { renderWithParams, extractFestivosDatesForPlan } from '../shared';
import { AnyRecord } from '@shared/types/common';

interface UseModelSyncProps {
  model: AnyRecord;
  onChange?: (p: AnyRecord) => void;
}

/**
 * Hook to sync model changes with onChange callback (semanal mode with festivosDates)
 */
export function useModelSync({ model, onChange }: UseModelSyncProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastEmittedRef = useRef('');

  useEffect(() => {
    const festivosRendered = renderWithParams(
      model.festivosTemplate,
      model.params
    );
    const festivosDates = extractFestivosDatesForPlan(festivosRendered);

    const payload = { semanal: { ...model, festivosDates } };
    const signature = JSON.stringify(payload);
    if (signature !== lastEmittedRef.current) {
      lastEmittedRef.current = signature;
      onChangeRef.current?.(payload);
    }
  }, [model]);
}

