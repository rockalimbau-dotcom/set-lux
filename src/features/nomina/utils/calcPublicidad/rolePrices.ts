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
    const baseNorm = String(baseRoleCode || '').replace(/[PR]$/, '') || normalized;


    const { jornada, travelDay, horaExtra, holidayDay, row } = calculateRolePrices({
      normalized,
      baseNorm,
      priceRows,
      p,
    });

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

