/**
 * Utilidad para traducir tipos de jornada
 * Soporta tanto el contexto de i18n (t) como getTranslation
 */

type JornadaType = 
  | 'Rodaje' 
  | 'Oficina' 
  | 'Pruebas de cámara'
  | 'Carga' 
  | 'Descarga' 
  | 'Localizar' 
  | 'Travel Day' 
  | '1/2 jornada'
  | 'Prelight' 
  | 'Recogida' 
  | 'Rodaje Festivo' 
  | 'Fin' 
  | 'Descanso';

export interface TranslationFunction {
  (key: string, defaultValue?: string): string;
}

export function normalizeJornadaType(tipo: string | null | undefined): string {
  const normalized = String(tipo || '').trim().toLowerCase();

  const aliases: Record<string, JornadaType> = {
    'rodaje': 'Rodaje',
    'filming': 'Rodaje',
    'rodatge': 'Rodaje',
    'oficina': 'Oficina',
    'office': 'Oficina',
    'pruebas de cámara': 'Pruebas de cámara',
    'pruebas de camara': 'Pruebas de cámara',
    'camera tests': 'Pruebas de cámara',
    'proves de càmera': 'Pruebas de cámara',
    'proves de camera': 'Pruebas de cámara',
    'carga': 'Carga',
    'loading': 'Carga',
    'càrrega': 'Carga',
    'carrega': 'Carga',
    'descarga': 'Descarga',
    'unloading': 'Descarga',
    'descàrrega': 'Descarga',
    'descarrega': 'Descarga',
    'localizar': 'Localizar',
    'location': 'Localizar',
    'localització': 'Localizar',
    'localitzacio': 'Localizar',
    'travel day': 'Travel Day',
    '1/2 jornada': '1/2 jornada',
    'half day': '1/2 jornada',
    'prelight': 'Prelight',
    'recogida': 'Recogida',
    'pickup': 'Recogida',
    'recollida': 'Recogida',
    'rodaje festivo': 'Rodaje Festivo',
    'holiday filming': 'Rodaje Festivo',
    'rodatge festiu': 'Rodaje Festivo',
    'fin': 'Fin',
    'end': 'Fin',
    'fi': 'Fin',
    'descanso': 'Descanso',
    'rest': 'Descanso',
    'descans': 'Descanso',
  };

  return aliases[normalized] || String(tipo || '').trim();
}

/**
 * Traduce un tipo de jornada usando una función de traducción
 * @param tipo Tipo de jornada a traducir
 * @param translateFn Función de traducción (puede ser t() de i18n o getTranslation)
 * @returns Texto traducido o el tipo original si no se encuentra traducción
 */
export function translateJornadaType(
  tipo: string | null | undefined,
  translateFn: TranslationFunction
): string {
  if (!tipo) return '';

  const normalizedTipo = normalizeJornadaType(tipo);
  
  const typeMap: Record<string, string> = {
    'Rodaje': translateFn('planning.shooting', 'Rodaje'),
    'Oficina': translateFn('planning.office', 'Oficina'),
    'Pruebas de cámara': translateFn('planning.cameraTests', 'Pruebas de cámara'),
    'Carga': translateFn('planning.loading', 'Carga'),
    'Descarga': translateFn('planning.unloading', 'Descarga'),
    'Localizar': translateFn('planning.location', 'Localizar'),
    'Travel Day': translateFn('planning.travelDay', 'Travel Day'),
    '1/2 jornada': translateFn('planning.halfDay', '1/2 jornada'),
    'Prelight': translateFn('planning.prelight', 'Prelight'),
    'Recogida': translateFn('planning.pickup', 'Recogida'),
    'Rodaje Festivo': translateFn('planning.holidayShooting', 'Rodaje Festivo'),
    'Fin': translateFn('planning.end', 'Fin'),
    'Descanso': translateFn('planning.rest', 'Descanso'),
  };
  
  return typeMap[normalizedTipo] || normalizedTipo;
}
