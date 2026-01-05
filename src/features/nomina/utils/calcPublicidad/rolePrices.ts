import { loadCondModel } from '../cond';
import { storage } from '@shared/services/localStorage.service';

/**
 * Default price rows for publicidad mode
 */
const DEFAULT_PRICE_ROWS = {
  'Gaffer': {
    'Precio jornada': '510',
    'Precio Día extra/Festivo': '892.5',
    'Travel day': '510',
    'Horas extras': '75',
    'Carga/descarga': '225',
    'Localización técnica': '420',
  },
  'Best boy': {
    'Precio jornada': '410',
    'Precio Día extra/Festivo': '717.5',
    'Travel day': '410',
    'Horas extras': '60',
    'Carga/descarga': '180',
    'Localización técnica': '320',
  },
  'Eléctrico': {
    'Precio jornada': '310',
    'Precio Día extra/Festivo': '542.5',
    'Travel day': '310',
    'Horas extras': '45',
    'Carga/descarga': '135',
  },
  'Auxiliar': {
    'Precio jornada': '250',
    'Precio Día extra/Festivo': '437.5',
    'Travel day': '250',
    'Horas extras': '35',
    'Carga/descarga': '105',
  },
  'Técnico de mesa': {
    'Precio jornada': '350',
    'Precio Día extra/Festivo': '612.5',
    'Travel day': '350',
    'Horas extras': '50',
    'Carga/descarga': '150',
  },
  'Finger boy': {
    'Precio jornada': '350',
    'Precio Día extra/Festivo': '612.5',
    'Travel day': '350',
    'Horas extras': '50',
    'Carga/descarga': '150',
  },
} as any;

/**
 * Default parameters for publicidad mode
 */
const DEFAULT_PARAMS = {
  jornadaTrabajo: '10',
  jornadaComida: '1',
  factorFestivo: '1.75',
  factorHoraExtraFestiva: '1.5',
  cortesiaMin: '15',
  taDiario: '10',
  taFinde: '12',
  nocturnidadComplemento: '50',
  nocturnoIni: '02:00',
  nocturnoFin: '06:00',
  dietaDesayuno: '10',
  dietaComida: '20',
  dietaCena: '30',
  dietaSinPernocta: '50',
  dietaAlojDes: '60',
  gastosBolsillo: '10',
  kilometrajeKm: '0.40',
  transporteDia: '15',
} as any;

/**
 * Parse number from various formats
 */
function num(v: unknown): number {
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
}

/**
 * Normalize string for comparison (remove accents, lowercase, remove P/R suffix)
 */
function normalizeStr(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/[PR]$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find price row by candidate role names
 */
function findPriceRow(priceRows: any, candidates: string[]) {
  // 1) Exactos primero
  for (const cand of candidates) {
    if (cand && priceRows[cand]) return { row: priceRows[cand], key: cand };
  }
  // 2) Match insensible a acentos/mayúsculas/sufijo P/R
  const candNorms = candidates.map(c => normalizeStr(c));
  for (const key of Object.keys(priceRows)) {
    const keyNorm = normalizeStr(key);
    for (const candNorm of candNorms) {
      if (keyNorm === candNorm) return { row: priceRows[key], key };
    }
  }
  return { row: {}, key: '' };
}

/**
 * Get numeric field from row using multiple candidate keys
 */
function getNumField(row: any, candidates: readonly string[]): number {
  // 1) Directo
  for (const cand of candidates) {
    if (cand && row[cand] != null) {
      const val = num(row[cand]);
      if ((import.meta as any).env.DEV) {
        console.debug('[NOMINA.PUBLICIDAD] getNumField - trying direct key "' + cand + '":', val);
      }
      if (val > 0) return val;
    }
  }
  // 2) Insensible a acentos/mayúsculas
  const candNorms = candidates.map(c => normalizeStr(c));
  for (const key of Object.keys(row)) {
    const keyNorm = normalizeStr(key);
    for (const candNorm of candNorms) {
      if (keyNorm === candNorm) {
        const val = num(row[key]);
        if ((import.meta as any).env.DEV) {
          console.debug('[NOMINA.PUBLICIDAD] getNumField - trying lowercase "' + candNorm + '":', val);
        }
        if (val > 0) return val;
      }
    }
  }
  return 0;
}

/**
 * Persist default prices to storage
 */
function persistDefaultPrices(project: any, priceRows: any) {
  try {
    const baseKey = project?.id || project?.nombre || 'tmp';
    const condKey = `cond_${baseKey}_publicidad`;
    const current = storage.getJSON<any>(condKey) || {};
    storage.setJSON(condKey, {
      ...current,
      prices: {
        ...(current?.prices || {}),
        ...priceRows,
      },
    });
  } catch {}
}

/**
 * Persist default parameters to storage
 */
function persistDefaultParams(project: any, params: any) {
  try {
    const baseKey = project?.id || project?.nombre || 'tmp';
    const condKey = `cond_${baseKey}_publicidad`;
    const current = storage.getJSON<any>(condKey) || {};
    storage.setJSON(condKey, {
      ...current,
      params: {
        ...(current?.params || {}),
        ...params,
      },
    });
  } catch {}
}

/**
 * Make role prices function for publicidad mode
 */
export function makeRolePrices(project: any) {
  // Forzar el modo a publicidad para que loadCondModel cargue las condiciones correctas
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'publicidad'
    }
  };
  
  const model = loadCondModel(projectWithMode, 'publicidad');
  let priceRows = model?.prices || {};
  let p = model?.params || {};

  // Fallback absoluto: si por cualquier motivo aún no hay precios en el modelo,
  // usar una tabla por defecto para que Nómina funcione desde el primer render.
  if (!priceRows || Object.keys(priceRows).length === 0) {
    priceRows = DEFAULT_PRICE_ROWS;
    persistDefaultPrices(projectWithMode, priceRows);
  }

  if (!p || Object.keys(p).length === 0) {
    p = DEFAULT_PARAMS;
    persistDefaultParams(projectWithMode, p);
  }

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm =
      String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    // Debug: log role processing
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - roleCode:', roleCode, 'baseRoleCode:', baseRoleCode);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - normalized:', normalized, 'baseNorm:', baseNorm);
    }

    const pickedRow = findPriceRow(priceRows, [normalized]);
    let row = pickedRow.row;
    const pickedBase = findPriceRow(priceRows, [baseNorm]);
    const baseRow = pickedBase.row;
    const pickedElec = findPriceRow(priceRows, ['Eléctrico', 'Electrico', 'E']);
    const elecRow = pickedElec.row;

    // Debug: log row selection
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - row for', normalized, '=> key:', pickedRow.key, row);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - baseRow for', baseNorm, '=> key:', pickedBase.key, baseRow);
      console.debug('[NOMINA.PUBLICIDAD] getForRole - elecRow => key:', pickedElec.key, elecRow);
    }

    // Para publicidad, el divisor de travel puede ser diferente
    const divTravel = num(p.divTravel) || 2.5; // Publicidad usa divisor 2.5

    let jornada, travelDay, horaExtra, holidayDay;
    if (normalized === 'REF') {
      const refFromBase = getNumField(baseRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      const refFromElec = getNumField(elecRow, ['Precio refuerzo', 'Precio Refuerzo', 'Refuerzo']);
      jornada = refFromBase || refFromElec || 0;
      travelDay = jornada / divTravel;
      horaExtra = getNumField(baseRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) ||
                  getNumField(elecRow, ['Horas extras', 'Horas Extras', 'Hora extra', 'Horas extra', 'HE', 'Hora Extra']) || 0;
      holidayDay = getNumField(baseRow, ['Precio Día extra/Festivo', 'Precio Día extra/festivo', 'Día extra/Festivo', 'Día festivo', 'Festivo']) ||
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

    // Debug: log calculated values
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - calculated values:', { jornada, travelDay, horaExtra });
    }

    const result = {
      jornada,
      travelDay,
      horaExtra,
      holidayDay,
      transporte: num(p.transporteDia) || 0,
      km: num(p.kilometrajeKm) || 0,
      dietas: {
        Desayuno: num(p.dietaDesayuno) || 0,
        Comida: num(p.dietaComida) || 0,
        Cena: num(p.dietaCena) || 0,
        'Dieta sin pernoctar': num(p.dietaSinPernocta) || 0,
        'Dieta completa + desayuno': num(p.dietaAlojDes) || 0,
        'Gastos de bolsillo': num(p.gastosBolsillo) || 0,
      },
      // Campos específicos de publicidad
      cargaDescarga: getNumField(row, ['Carga/descarga', 'Carga descarga', 'Carga/Descarga', 'Carga y descarga']) || 0,
      localizacionTecnica: getNumField(row, ['Localización técnica', 'Localizacion tecnica', 'Localización', 'Localizacion']) || 0,
      factorHoraExtraFestiva: num(p.factorHoraExtraFestiva) || 1.5,
    };

    // Debug: log final result
    if ((import.meta as any).env.DEV) {
      console.debug('[NOMINA.PUBLICIDAD] getForRole - result for', roleCode, ':', result);
    }

    return result;
  };

  return { getForRole };
}

