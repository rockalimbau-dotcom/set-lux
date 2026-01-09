import { loadCondModel } from '../cond';
import { DEFAULT_PRICE_ROWS, DEFAULT_PARAMS } from './rolePricesConstants';
import { num, getNumField } from './rolePricesHelpers';
import { persistDefaultPrices, persistDefaultParams } from './rolePricesPersistence';
import { calculateRolePrices } from './rolePricesCalculation';

/**
 * Make role prices function for diario mode
 */
export function makeRolePrices(project: any) {
  // Forzar el modo a diario para que loadCondModel cargue las condiciones correctas
  const projectWithMode = {
    ...project,
    conditions: {
      ...project?.conditions,
      tipo: 'diario'
    }
  };
  
  const model = loadCondModel(projectWithMode, 'diario');
  let basePriceRows = model?.prices || {};
  const prelightPriceRows = model?.pricesPrelight || {};
  const pickupPriceRows = model?.pricesPickup || {};
  let p = model?.params || {};

  // Fallback absoluto: si por cualquier motivo aún no hay precios en el modelo,
  // usar una tabla por defecto para que Nómina funcione desde el primer render.
  if (!basePriceRows || Object.keys(basePriceRows).length === 0) {
    basePriceRows = DEFAULT_PRICE_ROWS;
    persistDefaultPrices(projectWithMode, basePriceRows);
  }

  if (!p || Object.keys(p).length === 0) {
    p = DEFAULT_PARAMS;
    persistDefaultParams(projectWithMode, p);
  }

  // Helper para normalizar strings
  const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  
  // Determinar qué tabla de precios usar según el rol
  const getPriceTable = (roleCode: string): Record<string, any> => {
    const roleStr = String(roleCode || '');
    // Detectar si el rol tiene sufijo P (prelight) o R (pickup)
    const hasP = roleStr.endsWith('P') || roleStr.endsWith('p');
    const hasR = roleStr.endsWith('R') || roleStr.endsWith('r');
    
    if (hasP) {
      // Si hay tabla de prelight, intentar usarla; si no, usar base
      const baseRole = roleStr.replace(/[PR]$/i, '');
      if (Object.keys(prelightPriceRows).length > 0) {
        // Buscar por nombre exacto o normalizado
        if (prelightPriceRows[baseRole]) {
          return prelightPriceRows;
        }
        const baseRoleNorm = normalizeStr(baseRole);
        if (Object.keys(prelightPriceRows).some(k => normalizeStr(k) === baseRoleNorm)) {
          return prelightPriceRows;
        }
      }
      return basePriceRows;
    } else if (hasR) {
      // Si hay tabla de pickup, intentar usarla; si no, usar base
      const baseRole = roleStr.replace(/[PR]$/i, '');
      if (Object.keys(pickupPriceRows).length > 0) {
        // Buscar por nombre exacto o normalizado
        if (pickupPriceRows[baseRole]) {
          return pickupPriceRows;
        }
        const baseRoleNorm = normalizeStr(baseRole);
        if (Object.keys(pickupPriceRows).some(k => normalizeStr(k) === baseRoleNorm)) {
          return pickupPriceRows;
        }
      }
      return basePriceRows;
    }
    // Sin sufijo, usar tabla base
    return basePriceRows;
  };

  const getForRole = (roleCode: string, baseRoleCode: string | null = null) => {
    const normalized = String(roleCode || '').replace(/[PR]$/, '');
    const baseNorm = String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;

    // Determinar qué tabla usar según el rol
    const priceRows = getPriceTable(roleCode);
    // Si no encontramos en la tabla específica, usar base como fallback
    const fallbackPriceRows = basePriceRows;

    let priceResult = calculateRolePrices({
      normalized,
      baseNorm,
      priceRows,
      p,
    });
    
    // Si no encontramos precios en la tabla específica, intentar con la base como fallback
    if ((!priceResult.jornada || priceResult.jornada === 0) && priceRows !== fallbackPriceRows) {
      const fallbackResult = calculateRolePrices({
        normalized,
        baseNorm,
        priceRows: fallbackPriceRows,
        p,
      });
      // Solo usar fallback si tiene precios válidos
      if (fallbackResult.jornada && fallbackResult.jornada > 0) {
        priceResult = fallbackResult;
      }
    }
    
    const { jornada, travelDay, horaExtra, holidayDay, row } = priceResult;

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

    return result;
  };

  return { getForRole };
}

