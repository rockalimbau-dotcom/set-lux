/**
 * Festivos regionales de España por comunidad autónoma
 * Formato: YYYY-MM-DD
 */

export interface RegionalHoliday {
  date: string;
  name: string;
  regions: string[];
  type: 'regional' | 'local';
}

export const SPAIN_REGIONAL_HOLIDAYS: RegionalHoliday[] = [
  // 2025 - Festivos nacionales que se celebran en todas las regiones
  { date: '2025-01-01', name: 'Año Nuevo', regions: ['ES'], type: 'regional' },
  { date: '2025-01-06', name: 'Reyes', regions: ['ES'], type: 'regional' },
  { date: '2025-03-29', name: 'Viernes Santo', regions: ['ES'], type: 'regional' },
  { date: '2025-04-01', name: 'Lunes de Pascua', regions: ['ES'], type: 'regional' },
  { date: '2025-05-01', name: 'Día del Trabajador', regions: ['ES'], type: 'regional' },
  { date: '2025-08-15', name: 'Asunción', regions: ['ES'], type: 'regional' },
  { date: '2025-11-01', name: 'Todos los Santos', regions: ['ES'], type: 'regional' },
  { date: '2025-12-25', name: 'Navidad', regions: ['ES'], type: 'regional' },
  
  // Festivos nacionales que NO se celebran en todas las regiones
  // Día de la Hispanidad (10/12) - NO se celebra en Cataluña
  { date: '2025-10-12', name: 'Día de la Hispanidad', regions: ['ES', 'MD', 'AN', 'VC', 'GA', 'PV'], type: 'regional' },
  // Día de la Constitución (12/06) - NO se celebra en Cataluña
  { date: '2025-12-06', name: 'Día de la Constitución', regions: ['ES', 'MD', 'AN', 'VC', 'GA', 'PV'], type: 'regional' },
  // San Esteban (26/12) - Solo se celebra en algunas regiones
  { date: '2025-12-26', name: 'San Esteban', regions: ['CT', 'AN'], type: 'regional' },

  // Festivos específicos de Cataluña
  { date: '2025-06-24', name: 'San Juan', regions: ['CT'], type: 'regional' },
  { date: '2025-09-11', name: 'Diada de Cataluña', regions: ['CT'], type: 'regional' },

  // Festivos específicos de Madrid
  { date: '2025-05-02', name: 'Día de la Comunidad de Madrid', regions: ['MD'], type: 'regional' },
  { date: '2025-05-15', name: 'San Isidro', regions: ['MD'], type: 'regional' },

  // Festivos específicos de Andalucía
  { date: '2025-02-28', name: 'Día de Andalucía', regions: ['AN'], type: 'regional' },

  // Festivos específicos de Valencia
  { date: '2025-10-09', name: 'Día de la Comunidad Valenciana', regions: ['VC'], type: 'regional' },

  // Festivos específicos de Galicia
  { date: '2025-07-25', name: 'Día de Galicia', regions: ['GA'], type: 'regional' },

  // Festivos específicos del País Vasco
  { date: '2025-10-25', name: 'Día del País Vasco', regions: ['PV'], type: 'regional' },
];

/**
 * Mapeo de códigos de región a nombres
 */
export const REGION_NAMES: Record<string, string> = {
  'ES': 'España',
  'CT': 'Cataluña',
  'MD': 'Madrid',
  'AN': 'Andalucía',
  'VC': 'Valencia',
  'GA': 'Galicia',
  'PV': 'País Vasco',
};

/**
 * Obtiene festivos regionales para un país y región específicos
 */
export function getRegionalHolidays(
  country: string,
  region: string | null,
  year: number
): RegionalHoliday[] {
  if (country !== 'ES') {
    return [];
  }

  return SPAIN_REGIONAL_HOLIDAYS.filter(holiday => {
    // Si no hay región especificada, incluir solo festivos nacionales (regions incluye 'ES')
    if (!region) {
      return holiday.regions.includes('ES');
    }
    
    // Si hay región, incluir festivos que:
    // 1. Son nacionales (regions incluye 'ES') Y la región no está excluida
    // 2. O son específicos de la región (regions incluye la región)
    if (holiday.regions.includes('ES')) {
      // Si el festivo tiene 'ES' pero también tiene otras regiones específicas,
      // solo incluirlo si la región actual está en la lista
      if (holiday.regions.length > 1 && !holiday.regions.includes(region)) {
        return false; // Festivo nacional que NO se celebra en esta región
      }
      return true; // Festivo nacional que se celebra en todas las regiones
    }
    
    // Incluir festivos específicos de la región
    if (holiday.regions.includes(region)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Obtiene solo las fechas de los festivos regionales
 */
export function getRegionalHolidayDates(
  country: string,
  region: string | null,
  year: number
): string[] {
  return getRegionalHolidays(country, region, year)
    .map(holiday => holiday.date)
    .sort();
}
