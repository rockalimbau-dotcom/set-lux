import { loadCondModel } from '../cond';
import { ROLE_CODES_WITH_PR_SUFFIX, stripRoleSuffix } from '@shared/constants/roles';
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
  const normalizeStr = (s: string) => {
    const raw = String(s || '');
    const upper = raw.toUpperCase();
    const withoutSuffix = ROLE_CODES_WITH_PR_SUFFIX.has(upper) ? raw : raw.replace(/[PR]$/i, '');
    return withoutSuffix.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  };

  const normalizeLabel = (s: unknown): string =>
    String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const KNOWN_LABELS = new Set(
    [
      'Gaffer',
      'Best boy',
      'Eléctrico',
      'Eléctrico/a',
      'Auxiliar',
      'Meritorio',
      'Técnico de mesa',
      'Finger boy',
      'Rigger',
      'Rigging Gaffer',
      'Rigging Best Boy',
      'Rigging Eléctrico',
      'Técnico de Generador',
      'Grupista eléctrico',
      'Chofer eléctrico',
      'Eléctrico de potencia',
      'Técnico de prácticos',
    ].map(normalizeLabel)
  );
  
  // Determinar qué tabla de precios usar según el rol
  const getPriceTable = (roleCode: string): Record<string, any> => {
    const roleStr = String(roleCode || '');
    // Detectar si el rol tiene sufijo P (prelight) o R (pickup)
    const upperRole = roleStr.toUpperCase();
    const roleNorm = normalizeLabel(roleStr);
    const hasSuffix = /[PR]$/i.test(roleStr) && !ROLE_CODES_WITH_PR_SUFFIX.has(upperRole) && !KNOWN_LABELS.has(roleNorm);
    const hasP = hasSuffix && /P$/i.test(roleStr);
    const hasR = hasSuffix && /R$/i.test(roleStr);
    
    if (hasP) {
      // Si hay tabla de prelight, intentar usarla; si no, usar base
      const baseRole = roleStr.slice(0, -1);
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
      const baseRole = roleStr.slice(0, -1);
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
    const normalized = stripRoleSuffix(String(roleCode || ''));
    const baseNorm = stripRoleSuffix(String(baseRoleCode || '')) || normalized;

    // Determinar qué tabla usar según el rol
    const priceRows = getPriceTable(roleCode);
    // Si no encontramos en la tabla específica, usar base como fallback
    const fallbackPriceRows = basePriceRows;

    let priceResult = calculateRolePrices({
      normalized,
      baseNorm,
      priceRows,
      basePriceRows: fallbackPriceRows, // Pasar tabla base para buscar roles base de refuerzos
      p,
    });
    
    // Si no encontramos precios en la tabla específica, intentar con la base como fallback
    if ((!priceResult.jornada || priceResult.jornada === 0) && priceRows !== fallbackPriceRows) {
      const fallbackResult = calculateRolePrices({
        normalized,
        baseNorm,
        priceRows: fallbackPriceRows,
        basePriceRows: fallbackPriceRows,
        p,
      });
      // Solo usar fallback si tiene precios válidos
      if (fallbackResult.jornada && fallbackResult.jornada > 0) {
        priceResult = fallbackResult;
      }
    }
    
    const { jornada, halfJornada, travelDay, horaExtra, holidayDay, row } = priceResult;
    const materialPropioValue = getNumField(row, ['Material propio', 'Material Propio']) || 0;
    const rawMaterialType =
      (row?.['Material propio tipo'] ?? row?.['Material Propio tipo'] ?? '').toString().trim();
    const materialPropioType =
      rawMaterialType === 'semanal' || rawMaterialType === 'diario' ? rawMaterialType : 'diario';

    const result = {
      jornada,
      halfJornada,
      travelDay,
      horaExtra,
      holidayDay,
      materialPropioValue,
      materialPropioType,
      transporte: num(p.transporteDia) || 0,
      km: num(p.kilometrajeKm) || 0,
      dietas: {
        Desayuno: num(p.dietaDesayuno) || 0,
        Comida: num(p.dietaComida) || 0,
        Cena: num(p.dietaCena) || 0,
        'Dieta sin pernoctar': num(p.dietaSinPernocta) || 0,
        'Dieta con pernocta': num(p.dietaAlojDes) || 0,
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
