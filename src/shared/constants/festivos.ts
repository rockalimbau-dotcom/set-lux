import { fetchHolidays, readLocationFromSettings } from '@shared/services/holidays.service';
import i18n from '@i18n';

/**
 * Festivos de Cataluña 2025 (fallback estático)
 * Formato: YYYY-MM-DD
 */
export const FESTIVOS_CATALUNYA_2025_FALLBACK = [
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes
  '2025-03-29', // Viernes Santo
  '2025-04-01', // Lunes de Pascua
  '2025-05-01', // Día del Trabajador
  '2025-06-24', // San Juan
  '2025-08-15', // Asunción
  '2025-09-11', // Diada
  '2025-10-12', // Día de la Hispanidad
  '2025-11-01', // Todos los Santos
  '2025-12-06', // Día de la Constitución
  '2025-12-25', // Navidad
  '2025-12-26', // San Esteban
];

/**
 * Obtiene festivos dinámicamente según la localización del usuario
 */
export async function getDynamicFestivos(year: number = new Date().getFullYear()): Promise<string[]> {
  try {
    const { country, region } = readLocationFromSettings();
    console.log(`🎯 Getting dynamic festivos for ${country}${region ? `-${region}` : ''} for year ${year}`);
    const { holidays } = await fetchHolidays({ country, year, region });
    const festivos = holidays.map(h => h.date).sort();
    console.log(`🎉 Dynamic festivos loaded:`, festivos.slice(0, 5));
    return festivos;
  } catch (error) {
    console.warn(`⚠️ Using fallback festivos due to error:`, error);
    return FESTIVOS_CATALUNYA_2025_FALLBACK;
  }
}

/**
 * Genera el texto de festivos para las condiciones
 */
export function generateFestivosText(festivos: string[]): string {
  const festivosFormatted = festivos
    .map(date => {
      const [year, month, day] = date.split('-');
      return `${day}/${month}`;
    })
    .join(', ');
  
  const year = festivos[0]?.split('-')[0] || new Date().getFullYear();
  return i18n.t('conditions.defaultHolidays', { year, festivos: festivosFormatted });
}

/**
 * Genera el texto de festivos dinámicamente
 */
export async function generateDynamicFestivosText(year?: number): Promise<string> {
  const festivos = await getDynamicFestivos(year);
  return generateFestivosText(festivos);
}

/**
 * Verifica si una fecha es festiva (versión estática)
 */
export function isFestivo(date: string, festivos: string[] = FESTIVOS_CATALUNYA_2025_FALLBACK): boolean {
  return festivos.includes(date);
}

/**
 * Verifica si una fecha es festiva (versión dinámica)
 */
export async function isFestivoDynamic(date: string, year?: number): Promise<boolean> {
  const festivos = await getDynamicFestivos(year);
  return festivos.includes(date);
}

/**
 * Obtiene el texto de festivos por defecto (estático)
 */
export const DEFAULT_FESTIVOS_TEXT = generateFestivosText(FESTIVOS_CATALUNYA_2025_FALLBACK);
