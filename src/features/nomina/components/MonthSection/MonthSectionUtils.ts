import { parseYYYYMMDD } from '@shared/utils/date';
import { weekISOdays } from '../../utils/plan';

/**
 * Filtra semanas que tengan al menos un día dentro del rango de fechas
 */
export function filterWeeksByDateRange(
  allWeeks: any[],
  dateFrom: string,
  dateTo: string
): any[] {
  if (!allWeeks || allWeeks.length === 0) {
    return [];
  }

  const fromDate = parseYYYYMMDD(dateFrom);
  const toDate = parseYYYYMMDD(dateTo);
  
  if (!fromDate || !toDate) {
    return [];
  }

  return allWeeks.filter((w: any) => {
    const weekDays = weekISOdays(w);
    return weekDays.some((iso: string) => {
      const dayDate = parseYYYYMMDD(iso);
      return dayDate && dayDate >= fromDate && dayDate <= toDate;
    });
  });
}

/**
 * Calcula el total de dietas basado en el mapa de dietas y precios
 */
export function calculateTotalDietas(
  dietasMap: Map<string, number>,
  effectivePr: {
    dietas: Record<string, number>;
  },
  ticketValue: number,
  otherValue: number
): number {
  const cnt = (label: string) => dietasMap.get(label) || 0;
  return (
    cnt('Desayuno') * (effectivePr.dietas['Desayuno'] || 0) +
    cnt('Comida') * (effectivePr.dietas['Comida'] || 0) +
    cnt('Cena') * (effectivePr.dietas['Cena'] || 0) +
    cnt('Dieta sin pernoctar') * (effectivePr.dietas['Dieta sin pernoctar'] || 0) +
    cnt('Dieta con pernocta') * (effectivePr.dietas['Dieta con pernocta'] || 0) +
    cnt('Gastos de bolsillo') * (effectivePr.dietas['Gastos de bolsillo'] || 0) +
    (ticketValue || 0) +
    (otherValue || 0)
  );
}

/**
 * Genera la etiqueta de dietas como string
 */
export function buildDietasLabel(
  dietasMap: Map<string, number>,
  ticketValue: number,
  otherValue: number
): string {
  const dietasLabelParts: string[] = [];
  const cnt = (label: string) => dietasMap.get(label) || 0;
  
  if (cnt('Comida')) dietasLabelParts.push(`Comida x${cnt('Comida')}`);
  if (cnt('Cena')) dietasLabelParts.push(`Cena x${cnt('Cena')}`);
  if (cnt('Dieta sin pernoctar'))
    dietasLabelParts.push(
      `Dieta sin pernoctar x${cnt('Dieta sin pernoctar')}`
    );
  if (cnt('Dieta con pernocta'))
    dietasLabelParts.push(
      `Dieta con pernocta x${cnt('Dieta con pernocta')}`
    );
  if (cnt('Gastos de bolsillo'))
    dietasLabelParts.push(
      `Gastos de bolsillo x${cnt('Gastos de bolsillo')}`
    );
  if (ticketValue > 0)
    dietasLabelParts.push(`Ticket €${(ticketValue || 0).toFixed(2)}`);
  if (otherValue > 0)
    dietasLabelParts.push(`Otros €${(otherValue || 0).toFixed(2)}`);

  return dietasLabelParts.join(' · ') || '—';
}

/**
 * Detecta qué precios faltan basado en los datos y precios efectivos
 */
export function detectMissingPrices(
  projectMode: 'semanal' | 'mensual' | 'diario',
  data: {
    workedDays?: number;
    travelDays?: number;
    holidayDays?: number;
    horasExtra?: number;
    turnAround?: number;
    nocturnidad?: number;
    penaltyLunch?: number;
    transporte?: number;
    km?: number;
    rodaje?: number;
    oficina?: number;
    localizar?: number;
    carga?: number;
    descarga?: number;
    dietasMap?: Map<string, number>;
    ticketValue?: number;
    otherValue?: number;
    totalDiasTrabajados?: number;
    priceDays?: number;
    precioMensual?: number;
  },
  effectivePr: {
    jornada?: number;
    travelDay?: number;
    holidayDay?: number;
    horaExtra?: number;
    transporte?: number;
    km?: number;
    localizacionTecnica?: number;
    cargaDescarga?: number;
    dietas: Record<string, number>;
    factorHoraExtraFestiva?: number;
  }
): {
  jornada?: boolean;
  localizacionTecnica?: boolean;
  cargaDescarga?: boolean;
  travelDay?: boolean;
  holidayDay?: boolean;
  horaExtra?: boolean;
  transporte?: boolean;
  km?: boolean;
  dietas?: boolean;
} {
  const missingPrices: {
    jornada?: boolean;
    localizacionTecnica?: boolean;
    cargaDescarga?: boolean;
    travelDay?: boolean;
    holidayDay?: boolean;
    horaExtra?: boolean;
    transporte?: boolean;
    km?: boolean;
    dietas?: boolean;
  } = {};

  if (projectMode === 'diario') {
    const rodajeDays = (data.rodaje || 0) + (data.oficina || 0);
    if (rodajeDays > 0 && (effectivePr.jornada || 0) === 0) {
      missingPrices.jornada = true;
    }
    
    const localizacionDays = data.localizar || 0;
    const cargaDays = data.carga || 0;
    const descargaDays = data.descarga || 0;
    if (localizacionDays > 0 && (effectivePr.localizacionTecnica || 0) === 0) {
      missingPrices.localizacionTecnica = true;
    }
    if ((cargaDays + descargaDays) > 0 && (effectivePr.cargaDescarga || 0) === 0) {
      missingPrices.cargaDescarga = true;
    }
    
    if (data.travelDays && data.travelDays > 0 && (effectivePr.travelDay || 0) === 0) {
      missingPrices.travelDay = true;
    }
    if (data.holidayDays && data.holidayDays > 0 && (effectivePr.holidayDay || 0) === 0) {
      missingPrices.holidayDay = true;
    }
    
    const totalExtrasCount = (data.horasExtra || 0) + (data.turnAround || 0) + (data.nocturnidad || 0) + (data.penaltyLunch || 0);
    if (totalExtrasCount > 0 && (effectivePr.horaExtra || 0) === 0) {
      missingPrices.horaExtra = true;
    }
    
    if (data.transporte && data.transporte > 0 && (effectivePr.transporte || 0) === 0) {
      missingPrices.transporte = true;
    }
    if (data.km && (data.km || 0) > 0 && (effectivePr.km || 0) === 0) {
      missingPrices.km = true;
    }
    
    const cnt = (label: string) => (data.dietasMap?.get(label) || 0);
    const hasDietasData = cnt('Comida') > 0 || cnt('Cena') > 0 || 
                          cnt('Dieta sin pernoctar') > 0 || cnt('Dieta con pernocta') > 0 ||                           cnt('Gastos de bolsillo') > 0 || (data.ticketValue || 0) > 0 || (data.otherValue || 0) > 0;
    if (hasDietasData) {
      const totalDietas = calculateTotalDietas(data.dietasMap || new Map(), effectivePr, data.ticketValue || 0, data.otherValue || 0);
      if (totalDietas === 0) {
        const allDietasPricesZero = 
          (effectivePr.dietas['Comida'] || 0) === 0 &&
          (effectivePr.dietas['Cena'] || 0) === 0 &&
          (effectivePr.dietas['Dieta sin pernoctar'] || 0) === 0 &&
          ((effectivePr.dietas['Dieta con pernocta'] ||  0) === 0) &&
          (effectivePr.dietas['Gastos de bolsillo'] || 0) === 0;
        if (allDietasPricesZero) {
          missingPrices.dietas = true;
        }
      }
    }
  } else {
    // Cálculo estándar para semanal/mensual
    if (projectMode === 'mensual') {
      const precioMensual = data.precioMensual || 0;
      const precioDiario = precioMensual > 0 && (data.priceDays || 0) > 0 
        ? precioMensual / (data.priceDays || 1) 
        : (effectivePr.jornada || 0);
      if (data.totalDiasTrabajados && data.totalDiasTrabajados > 0 && precioDiario === 0) {
        missingPrices.jornada = true;
      }
    } else {
      if (data.workedDays && data.workedDays > 0 && (effectivePr.jornada || 0) === 0) {
        missingPrices.jornada = true;
      }
    }
    
    if (data.travelDays && data.travelDays > 0 && (effectivePr.travelDay || 0) === 0) {
      missingPrices.travelDay = true;
    }
    if (data.holidayDays && data.holidayDays > 0 && (effectivePr.holidayDay || 0) === 0) {
      missingPrices.holidayDay = true;
    }
    
    const totalExtrasCount = (data.horasExtra || 0) + (data.turnAround || 0) + (data.nocturnidad || 0) + (data.penaltyLunch || 0);
    if (totalExtrasCount > 0 && (effectivePr.horaExtra || 0) === 0) {
      missingPrices.horaExtra = true;
    }
    
    if (data.transporte && data.transporte > 0 && (effectivePr.transporte || 0) === 0) {
      missingPrices.transporte = true;
    }
    if (data.km && (data.km || 0) > 0 && (effectivePr.km || 0) === 0) {
      missingPrices.km = true;
    }
    
    const cnt = (label: string) => (data.dietasMap?.get(label) || 0);
    const hasDietasData = cnt('Comida') > 0 || cnt('Cena') > 0 || 
                          cnt('Dieta sin pernoctar') > 0 || cnt('Dieta con pernocta') > 0 ||                           cnt('Gastos de bolsillo') > 0 || (data.ticketValue || 0) > 0 || (data.otherValue || 0) > 0;
    if (hasDietasData) {
      const totalDietas = calculateTotalDietas(data.dietasMap || new Map(), effectivePr, data.ticketValue || 0, data.otherValue || 0);
      if (totalDietas === 0) {
        const allDietasPricesZero = 
          (effectivePr.dietas['Comida'] || 0) === 0 &&
          (effectivePr.dietas['Cena'] || 0) === 0 &&
          (effectivePr.dietas['Dieta sin pernoctar'] || 0) === 0 &&
          ((effectivePr.dietas['Dieta con pernocta'] ||  0) === 0) &&
          (effectivePr.dietas['Gastos de bolsillo'] || 0) === 0;
        if (allDietasPricesZero) {
          missingPrices.dietas = true;
        }
      }
    }
  }

  return missingPrices;
}

