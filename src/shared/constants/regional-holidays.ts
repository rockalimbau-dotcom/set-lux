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
  // 2025
  { date: '2025-01-01', name: 'Año Nuevo', regions: ['ES'], type: 'regional' },
  { date: '2025-01-06', name: 'Reyes', regions: ['ES'], type: 'regional' },
  { date: '2025-03-29', name: 'Viernes Santo', regions: ['ES'], type: 'regional' },
  { date: '2025-04-01', name: 'Lunes de Pascua', regions: ['ES'], type: 'regional' },
  { date: '2025-05-01', name: 'Día del Trabajador', regions: ['ES'], type: 'regional' },
  { date: '2025-08-15', name: 'Asunción', regions: ['ES'], type: 'regional' },
  { date: '2025-10-12', name: 'Día de la Hispanidad', regions: ['ES'], type: 'regional' },
  { date: '2025-11-01', name: 'Todos los Santos', regions: ['ES'], type: 'regional' },
  { date: '2025-12-06', name: 'Día de la Constitución', regions: ['ES'], type: 'regional' },
  { date: '2025-12-25', name: 'Navidad', regions: ['ES'], type: 'regional' },
  { date: '2025-12-26', name: 'San Esteban', regions: ['ES'], type: 'regional' },

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
    // Incluir festivos nacionales (regions incluye 'ES')
    if (holiday.regions.includes('ES')) {
      return true;
    }
    
    // Incluir festivos específicos de la región
    if (region && holiday.regions.includes(region)) {
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
