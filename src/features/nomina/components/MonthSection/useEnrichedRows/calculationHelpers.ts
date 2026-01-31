/**
 * Calculate totals for diario mode
 */
export function calculateDiarioTotals(
  rodaje: number | undefined,
  pruebasCamara: number | undefined,
  oficina: number | undefined,
  localizar: number | undefined,
  carga: number | undefined,
  descarga: number | undefined,
  travelDays: number,
  holidayDays: number,
  horasExtraValue: number,
  turnAroundValue: number,
  nocturnidadValue: number,
  penaltyLunchValue: number,
  transporteValue: number,
  kmValue: number,
  totalDietas: number,
  effectivePr: any,
  prelight?: number | undefined,
  recogida?: number | undefined
): {
  totalDias: number;
  totalTravel: number;
  totalHolidays: number;
  totalExtras: number;
  totalTrans: number;
  totalKm: number;
  totalLocalizacion: number;
  totalCargaDescarga: number;
  totalBruto: number;
} {
  // Para los cálculos de precio, prelight y recogida se cuentan como rodaje
  const rodajeDays = (rodaje || 0) + (pruebasCamara || 0) + (oficina || 0) + (prelight || 0) + (recogida || 0);
  const totalDias = rodajeDays * (effectivePr.jornada || 0);

  const localizacionDays = localizar || 0;
  const cargaDays = carga || 0;
  const descargaDays = descarga || 0;
  const totalLocalizacion = localizacionDays * (effectivePr.localizacionTecnica || 0);
  const totalCargaDescarga = (cargaDays + descargaDays) * (effectivePr.cargaDescarga || 0);

  const totalTravel = travelDays * (effectivePr.travelDay || 0);
  const totalHolidays = holidayDays * (effectivePr.holidayDay || 0);

  // Total horas extras = horas extras + turn around + nocturnidad + penalty lunch + horas extras festivas
  const horasExtrasFestivas = 0; // TODO: Necesitamos datos de horas extras festivas
  const totalExtras =
    horasExtraValue * (effectivePr.horaExtra || 0) +
    turnAroundValue * (effectivePr.horaExtra || 0) +
    nocturnidadValue * (effectivePr.horaExtra || 0) * (effectivePr.factorHoraExtraFestiva || 1) +
    penaltyLunchValue * (effectivePr.horaExtra || 0) +
    horasExtrasFestivas * (effectivePr.horaExtra || 0) * (effectivePr.factorHoraExtraFestiva || 1);

  const totalTrans = transporteValue * (effectivePr.transporte || 0);
  const totalKm = (kmValue || 0) * (effectivePr.km || 0);

  const totalBruto =
    totalDias +
    totalLocalizacion +
    totalCargaDescarga +
    totalTravel +
    totalHolidays +
    totalExtras +
    totalDietas +
    totalTrans +
    totalKm;

  return {
    totalDias,
    totalTravel,
    totalHolidays,
    totalExtras,
    totalTrans,
    totalKm,
    totalLocalizacion,
    totalCargaDescarga,
    totalBruto,
  };
}

/**
 * Calculate totals for semanal/mensual mode
 */
export function calculateStandardTotals(
  projectMode: 'semanal' | 'mensual',
  totalDiasTrabajados: number,
  workedDays: number,
  travelDays: number,
  holidayDays: number,
  horasExtraValue: number,
  turnAroundValue: number,
  nocturnidadValue: number,
  penaltyLunchValue: number,
  transporteValue: number,
  kmValue: number,
  totalDietas: number,
  effectivePr: any,
  priceDays: number
): {
  totalDias: number;
  totalTravel: number;
  totalHolidays: number;
  totalExtras: number;
  totalTrans: number;
  totalKm: number;
  totalBruto: number;
} {
  let totalDias: number;
  if (projectMode === 'mensual') {
    // Para mensual: usar precio diario calculado desde precio mensual
    const precioMensual = (effectivePr as any).precioMensual || 0;
    const precioDiario =
      precioMensual > 0 && priceDays > 0 ? precioMensual / priceDays : effectivePr.jornada || 0;
    totalDias = totalDiasTrabajados * precioDiario;
  } else {
    // Para semanal: usar precio jornada como antes
    totalDias = workedDays * (effectivePr.jornada || 0);
  }

  const totalTravel = travelDays * (effectivePr.travelDay || 0);
  const totalHolidays = holidayDays * (effectivePr.holidayDay || 0);
  const totalExtras =
    (horasExtraValue + turnAroundValue + nocturnidadValue + penaltyLunchValue) *
    (effectivePr.horaExtra || 0);
  const totalTrans = transporteValue * (effectivePr.transporte || 0);
  const totalKm = (kmValue || 0) * (effectivePr.km || 0);

  const totalBruto =
    totalDias +
    totalTravel +
    totalHolidays +
    totalExtras +
    totalDietas +
    totalTrans +
    totalKm;

  return {
    totalDias,
    totalTravel,
    totalHolidays,
    totalExtras,
    totalTrans,
    totalKm,
    totalBruto,
  };
}

