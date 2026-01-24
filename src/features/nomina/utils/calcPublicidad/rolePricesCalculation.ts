import { num, getNumField, findPriceRow } from './rolePricesHelpers';

interface RolePriceCalculationParams {
  normalized: string;
  baseNorm: string;
  priceRows: any;
  basePriceRows?: any; // Tabla base para buscar roles base de refuerzos
  p: any;
}

/**
 * Calculate prices for a specific role
 */
export function calculateRolePrices({
  normalized,
  baseNorm,
  priceRows,
  basePriceRows,
  p,
}: RolePriceCalculationParams) {
  // Para refuerzos, siempre usar la tabla base para buscar el rol base
  const rowsForRefuerzo = basePriceRows || priceRows;
  
  const pickedRow = findPriceRow(priceRows, [normalized]);
  let row = pickedRow.row;
  const pickedBase = findPriceRow(priceRows, [baseNorm]);
  const baseRow = pickedBase.row;
  const pickedElec = findPriceRow(rowsForRefuerzo, ['Eléctrico', 'Electrico', 'E']);
  const elecRow = pickedElec.row;


  // Para diario, el divisor de travel puede ser diferente
  const divTravel = num(p.divTravel) || 2.5; // Diario usa divisor 2.5

  // Helper para crear lista de candidatos de rol (código + label + variantes)
  const createRoleCandidates = (roleInput: string): string[] => {
    const candidates = [roleInput];
    
    // Mapeo completo de códigos a labels
    const codeToLabel: Record<string, string> = {
      'G': 'Gaffer',
      'BB': 'Best boy',
      'RG': 'Rigging Gaffer',
      'RBB': 'Rigging Best Boy',
      'RE': 'Rigging Eléctrico',
      'E': 'Eléctrico',
      'AUX': 'Auxiliar',
      'M': 'Meritorio',
      'TM': 'Técnico de mesa',
      'FB': 'Finger boy',
      'TG': 'Técnico de Generador',
      'EPO': 'Eléctrico de potencia',
      'TP': 'Técnico de prácticos',
      'RIG': 'Rigger',
    };
    
    // Mapeo completo de labels a códigos (incluyendo variantes)
    const labelToCode: Record<string, string> = {
      'Gaffer': 'G',
      'Best boy': 'BB',
      'Best Boy': 'BB',
      'Rigging Gaffer': 'RG',
      'Rigging Best Boy': 'RBB',
      'Rigging Best Girl': 'RBB',
      'Rigging Eléctrico': 'RE',
      'Rigging Electrico': 'RE',
      'Rigging eléctrica': 'RE',
      'Rigging electrica': 'RE',
      'Eléctrico': 'E',
      'Eléctrico/a': 'E',
      'Electrico': 'E',
      'Electrico/a': 'E',
      'Auxiliar': 'AUX',
      'Meritorio': 'M',
      'Técnico de mesa': 'TM',
      'Tecnico de mesa': 'TM',
      'Finger boy': 'FB',
      'Finger Boy': 'FB',
      'Técnico de Generador': 'TG',
      'Tecnico de Generador': 'TG',
      'Eléctrico de potencia': 'EPO',
      'Electrico de potencia': 'EPO',
      'Técnico de prácticos': 'TP',
      'Tecnico de practicos': 'TP',
      'Rigger': 'RIG',
      // También incluir códigos directos
      'G': 'G',
      'BB': 'BB',
      'RG': 'RG',
      'RBB': 'RBB',
      'RE': 'RE',
      'E': 'E',
      'AUX': 'AUX',
      'M': 'M',
      'TM': 'TM',
      'FB': 'FB',
      'TG': 'TG',
      'EPO': 'EPO',
      'TP': 'TP',
      'RIG': 'RIG',
    };
    
    // Si es un código, añadir su label
    const label = codeToLabel[roleInput];
    if (label && !candidates.includes(label)) {
      candidates.push(label);
    }
    
    // Si es un label, añadir su código
    const code = labelToCode[roleInput];
    if (code && !candidates.includes(code)) {
      candidates.push(code);
    }
    
    return candidates;
  };

  let jornada, travelDay, horaExtra, holidayDay;
  if (normalized === 'REF' || (normalized.startsWith('REF') && normalized.length > 3)) {
    // Si es REF o REF + rol base (REFG, REFBB, etc.), buscar "Precio refuerzo" en la fila correspondiente
    // Para refuerzos, SIEMPRE buscar directamente en rowsForRefuerzo (basePriceRows), ignorar prelight/pickup
    let targetRow: any = {};
    
    if (normalized.startsWith('REF') && normalized.length > 3) {
      // Extraer el rol base (G, BB, E, etc.)
      const baseRole = normalized.substring(3);
      // Buscar directamente en rowsForRefuerzo (tabla base, no prelight/pickup)
      const baseRoleCandidates = createRoleCandidates(baseRole);
      const baseRolePicked = findPriceRow(rowsForRefuerzo, baseRoleCandidates);
      targetRow = baseRolePicked.row || {};
    } else if (normalized === 'REF' && baseNorm && baseNorm !== 'REF') {
      // Si es REF con baseNorm (ej: calculateRolePrices con normalized='REF', baseNorm='GAFFER'), usar la fila del rol base
      // Buscar directamente en rowsForRefuerzo (tabla base, no prelight/pickup)
      const baseRoleCandidates = createRoleCandidates(baseNorm);
      const baseRolePicked = findPriceRow(rowsForRefuerzo, baseRoleCandidates);
      targetRow = baseRolePicked.row || {};
    }
    
    // Si targetRow está vacío, intentar con baseRow como último recurso
    if (!targetRow || Object.keys(targetRow).length === 0) {
      targetRow = baseRow || {};
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

