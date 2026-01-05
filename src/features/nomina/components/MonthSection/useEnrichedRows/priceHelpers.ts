import { RolePrices } from '../MonthSectionTypes';

/**
 * Get effective role prices, handling publicidad mode special case
 */
export function getEffectiveRolePrices(
  pr: any,
  projectMode: 'semanal' | 'mensual' | 'publicidad',
  refuerzoSet: Set<string>,
  keyNoPR: string,
  rolePrices: RolePrices,
  baseRoleLabel: string
): any {
  // Para publicidad: si el rol no tiene precio jornada (no está en condiciones),
  // forzar todos los precios a 0 para que no se muestren cantidades
  // pero sí se pueden mostrar días trabajados
  const hasValidPrices = projectMode === 'publicidad' ? pr.jornada > 0 : true;
  
  if (projectMode === 'publicidad' && !hasValidPrices) {
    return {
      ...pr,
      jornada: 0,
      travelDay: 0,
      horaExtra: 0,
      holidayDay: 0,
      transporte: 0,
      km: 0,
      cargaDescarga: 0,
      localizacionTecnica: 0,
      dietas: {
        Desayuno: 0,
        Comida: 0,
        Cena: 0,
        'Dieta sin pernoctar': 0,
        'Dieta completa + desayuno': 0,
        'Gastos de bolsillo': 0,
      },
    };
  }
  
  return pr;
}

