import { num, getNumField, findPriceRow } from './rolePricesHelpers';

interface RolePriceCalculationParams {
  normalized: string;
  baseNorm: string;
  priceRows: any;
  p: any;
}

/**
 * Calculate prices for a specific role
 */
export function calculateRolePrices({
  normalized,
  baseNorm,
  priceRows,
  p,
}: RolePriceCalculationParams) {
  const pickedRow = findPriceRow(priceRows, [normalized]);
  let row = pickedRow.row;
  const pickedBase = findPriceRow(priceRows, [baseNorm]);
  const baseRow = pickedBase.row;
  const pickedElec = findPriceRow(priceRows, ['Eléctrico', 'Electrico', 'E']);
  const elecRow = pickedElec.row;


  // Para diario, el divisor de travel puede ser diferente
  const divTravel = num(p.divTravel) || 2.5; // Diario usa divisor 2.5

  let jornada, travelDay, horaExtra, holidayDay;
  if (normalized === 'REF' || (normalized.startsWith('REF') && normalized.length > 3)) {
    // Si es REF o REF + rol base (REFG, REFBB, etc.), buscar "Precio refuerzo" en la fila correspondiente
    let targetRow = baseRow;
    if (normalized.startsWith('REF') && normalized.length > 3) {
      // Extraer el rol base (G, BB, E, etc.)
      const baseRole = normalized.substring(3);
      const baseRolePicked = findPriceRow(priceRows, [baseRole]);
      targetRow = baseRolePicked.row;
      // Si no encontramos la fila del rol base, usar baseRow como fallback
      if (!targetRow || Object.keys(targetRow).length === 0) {
        targetRow = baseRow;
      }
    } else if (normalized === 'REF' && baseNorm && baseNorm !== 'REF') {
      // Si es REF con baseNorm (ej: calculateRolePrices con normalized='REF', baseNorm='GAFFER'), usar la fila del rol base
      const baseRolePicked = findPriceRow(priceRows, [baseNorm]);
      targetRow = baseRolePicked.row;
      // Si no encontramos la fila del rol base, usar baseRow como fallback
      if (!targetRow || Object.keys(targetRow).length === 0) {
        targetRow = baseRow;
      }
    }
    
    const refFromTarget = getNumField(targetRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
    const refFromElec = getNumField(elecRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
    jornada = refFromTarget || refFromElec || 0;
    travelDay = jornada / divTravel;
    horaExtra = getNumField(targetRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
                getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
    holidayDay = getNumField(targetRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
                 getNumField(elecRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
  } else {
    // Fallback: si no encontramos fila directa para el rol, usar la de Eléctrico
    if (!row || Object.keys(row).length === 0) {
      row = (Object.keys(baseRow || {}).length > 0 ? baseRow : elecRow) as any;
    }
    jornada = getNumField(row, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
    travelDay = getNumField(row, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) ||
                (jornada > 0 ? jornada / divTravel : 0);
    horaExtra = getNumField(row, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']);
    holidayDay = getNumField(row, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
  }


  return {
    jornada,
    travelDay,
    horaExtra,
    holidayDay,
    row,
  };
}

