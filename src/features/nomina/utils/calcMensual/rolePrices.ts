import { loadCondModel } from '../cond';

/**
 * Create a role prices function for a project
 */
export function makeRolePrices(project: any) {
  const model = loadCondModel(project);
  const priceRows = model?.prices || {};
  const p = model?.params || {};

  // Debug removed to improve performance

  const num = (v: unknown) => {
    if (v == null || v === '') return 0;
    const s = String(v)
      .trim()
      .replace(/\u00A0/g, '')
      .replace(/[€%]/g, '')
      .replace(/\s+/g, '');
    const t =
      s.includes(',') && s.includes('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(',', '.');
    const n = Number(t);
    return isFinite(n) ? n : 0;
  };

  const normalizeStr = (s: unknown): string =>
    String(s == null ? '' : s)
      .replace(/[PR]$/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const findPriceRow = (candidates: string[]) => {
    // 1) Exactos primero
    for (const cand of candidates) {
      if (cand && priceRows[cand]) return { row: priceRows[cand], key: cand };
    }
    // 2) Match insensible a acentos/mayúsculas/sufijo P/R
    const candNorms = candidates.map(c => normalizeStr(c));
    for (const key of Object.keys(priceRows)) {
      const keyNorm = normalizeStr(key);
      if (candNorms.includes(keyNorm)) return { row: priceRows[key], key };
    }
    // 3) Intento extra: si keys vienen con sufijo P/R, comparar sin sufijo
    for (const key of Object.keys(priceRows)) {
      const keyBaseNorm = normalizeStr(String(key).replace(/[PR]$/i, ''));
      if (candNorms.includes(keyBaseNorm)) return { row: priceRows[key], key };
    }
    return { row: {} as any, key: '' };
  };

  // Intenta obtener un número desde una fila probando varias variantes de nombre de columna
  const getNumField = (row: any, candidates: string[]): number => {
    if (!row || typeof row !== 'object') return 0;
    
    for (const key of candidates) {
      const direct = row[key];
      if (direct != null && direct !== '') return num(direct);
    }
    // Búsqueda case-insensitive por si cambian mayúsculas/acentos
    const lowerToValue = new Map<string, unknown>();
    for (const k of Object.keys(row)) lowerToValue.set(k.toLowerCase(), row[k]);
    for (const key of candidates) {
      const v = lowerToValue.get(key.toLowerCase());
      if (v != null && v !== '') return num(v);
    }
    return 0;
  };

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm =
      String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    const pickedRow = findPriceRow([normalized]);
    const row = pickedRow.row;
    const pickedBase = findPriceRow([baseNorm]);
    const baseRow = pickedBase.row;
    const pickedElec = findPriceRow(['Eléctrico', 'Electrico', 'E']);
    const elecRow = pickedElec.row;

    // Para mensual, el divisor de travel puede ser diferente
    const divTravel = num(p.divTravel) || 3; // Mensual usa divisor 3 en lugar de 2

    let jornada, travelDay, horaExtra, holidayDay;
    if (normalized === 'REF') {
      const refFromBase = getNumField(baseRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const baseJornada = getNumField(baseRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
      const elecRef = getNumField(elecRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const elecJor = getNumField(elecRow, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']);
      jornada = refFromBase || baseJornada || elecRef || elecJor || 0;
      const travelBase = getNumField(baseRow, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']);
      travelDay = travelBase || (jornada ? jornada / divTravel : 0);
      horaExtra =
        getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        getNumField(baseRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
        0;
      holidayDay = 
        getNumField(elecRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
        getNumField(baseRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
        0;
    } else {
      jornada = getNumField(row, ['Precio jornada', 'Precio Jornada', 'Jornada', 'Precio dia', 'Precio día']) || 0;
      travelDay = getNumField(row, ['Travel day', 'Travel Day', 'Travel', 'Día de viaje', 'Dia de viaje', 'Día travel', 'Dia travel', 'TD']) || (jornada ? jornada / divTravel : 0);
      horaExtra = getNumField(row, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
      holidayDay = getNumField(row, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) || 0;
    }

    // Obtener precio mensual para cálculo de precio diario
    const precioMensual = getNumField(row, ['Precio mensual', 'Precio Mensual', 'Mensual']) || 0;

    const result = {
      jornada,
      travelDay,
      horaExtra,
      holidayDay,
      precioMensual, // Añadir precio mensual al resultado
      transporte: num(p.transporteDia),
      km: num(p.kilometrajeKm),
      dietas: {
        Comida: num(p.dietaComida),
        Cena: num(p.dietaCena),
        'Dieta sin pernoctar': num(p.dietaSinPernocta),
        'Dieta completa + desayuno': num(p.dietaAlojDes),
        'Gastos de bolsillo': num(p.gastosBolsillo),
      },
    };

    return result;
  };

  return { getForRole };
}

