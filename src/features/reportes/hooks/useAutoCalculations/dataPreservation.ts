import { convertHorasExtraToNewFormat } from '../../utils/runtime';
import { isDebugEnabled } from './useAutoCalculationsUtils';

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
  const debugEnabled = isDebugEnabled();

  if (off) {
    // Si no está trabajando en este bloque, vaciar
    return { value: '', isManual: false };
  }

  // Cuando cambia horasExtraTipo, SIEMPRE recalcular desde el horario
  if (horasExtraTipoChanged) {
    return { value: autoExtra, isManual: false };
  }

  // Si el valor es MANUAL (el usuario lo editó) Y NO cambió el tipo, preservarlo y convertirlo al nuevo formato
  if (manualExtra) {
    if (currExtra !== undefined && currExtra !== null && String(currExtra).trim() !== '') {
      const convertedValue = convertHorasExtraToNewFormat(currExtra, horasExtraTipo);
      const finalValue = convertedValue && convertedValue !== '' ? convertedValue : String(currExtra);


      return { value: finalValue, isManual: true };
    } else {
      // Si estaba marcado como manual pero ahora está vacío, preservar el vacío
      return { value: '', isManual: true };
    }
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
  if (off) return '';
  return manual ? currValue : autoValue !== currValue ? autoValue : currValue;
}

