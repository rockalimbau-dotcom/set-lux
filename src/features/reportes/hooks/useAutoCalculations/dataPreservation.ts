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
  /** Tras cambiar jornada en Condiciones o horarios en el plan: no conservar extras obsoletos. */
  forceRecalcAuto?: boolean;
  off: boolean;
}

/**
 * Preserva o recalcula las horas extra según el estado manual/automático
 */
export function preserveOrRecalculateHorasExtra({
  currExtra,
  autoExtra,
  manualExtra,
  horasExtraTipo,
  horasExtraTipoChanged,
  forceRecalcAuto = false,
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
    return { value: '', isManual: false };
  }

  if (horasExtraTipoChanged || forceRecalcAuto) {
    return { value: autoExtra, isManual: false };
  }

  if (manualExtra) {
    if (hasCurrentValue) {
      const convertedValue = convertHorasExtraToNewFormat(currExtra, horasExtraTipo);
      const finalValue = convertedValue && convertedValue !== '' ? convertedValue : String(currExtra);
      return { value: finalValue, isManual: true };
    }
    return { value: '', isManual: true };
  }

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
    return '';
  }
  return manual ? currValue : autoValue !== currValue ? autoValue : currValue;
}
