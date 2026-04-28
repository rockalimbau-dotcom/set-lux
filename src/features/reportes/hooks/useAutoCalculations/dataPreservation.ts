import { convertHorasExtraToNewFormat } from '../../utils/runtime';

interface PreserveHorasExtraParams {
  sourceState: any;
  pk: string;
  iso: string;
  autoExtra: string;
  currExtra: any;
  manualExtra: boolean;
  horasExtraTipo: string;
  horasExtraTipoChanged: boolean;
  off: boolean;
}

/**
 * Preserva o recalcula las horas extra según el estado manual/automático
 */
export function preserveOrRecalculateHorasExtra({
  sourceState,
  pk,
  iso,
  autoExtra,
  currExtra,
  manualExtra,
  horasExtraTipo,
  horasExtraTipoChanged,
  off,
}: PreserveHorasExtraParams): {
  value: string;
  isManual: boolean;
} {
  const hasCurrentValue =
    currExtra !== undefined &&
    currExtra !== null &&
    String(currExtra).trim() !== '';

  if (off) {
    // Evitar borrar en bucle un valor manual cuando hay desajustes temporales de bloque.
    if (hasCurrentValue) {
      return { value: String(currExtra), isManual: true };
    }
    return { value: '', isManual: false };
  }

  // Si el valor es MANUAL (el usuario lo editó), preservarlo y convertirlo al nuevo formato
  if (manualExtra) {
    if (hasCurrentValue) {
      const convertedValue = convertHorasExtraToNewFormat(currExtra, horasExtraTipo);
      const finalValue = convertedValue && convertedValue !== '' ? convertedValue : String(currExtra);

      return { value: finalValue, isManual: true };
    } else {
      // Si estaba marcado como manual pero ahora está vacío, preservar el vacío
      return { value: '', isManual: true };
    }
  }

  // Cuando cambia horasExtraTipo, recalcular desde el horario solo para valores automáticos
  if (horasExtraTipoChanged) {
    return { value: autoExtra, isManual: false };
  }

  // Si el autocalculado viene vacío pero la celda ya tiene valor, preservar para evitar
  // carreras entre escritura manual y reconciliación automática.
  if (!manualExtra && hasCurrentValue && String(autoExtra || '').trim() === '') {
    return { value: String(currExtra), isManual: true };
  }

  // Si el valor NO es manual Y NO cambió el tipo, usar el nuevo autoExtra

  return { value: autoExtra, isManual: false };
}

interface PreserveValueParams {
  currValue: any;
  autoValue: string;
  manual: boolean;
  off: boolean;
}

/**
 * Preserva un valor manual o usa el automático
 */
export function preserveOrUseAuto({
  currValue,
  autoValue,
  manual,
  off,
}: PreserveValueParams): string {
  if (off) {
    if (currValue !== undefined && currValue !== null && String(currValue).trim() !== '') {
      return String(currValue);
    }
    return '';
  }
  return manual ? currValue : autoValue !== currValue ? autoValue : currValue;
}

