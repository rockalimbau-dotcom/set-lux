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
  | 'Prelight' 
  | 'Recogida' 
  | 'Rodaje Festivo' 
  | 'Fin' 
  | 'Descanso';

export interface TranslationFunction {
  (key: string, defaultValue?: string): string;
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
  
  const typeMap: Record<string, string> = {
    'Rodaje': translateFn('planning.shooting', 'Rodaje'),
    'Oficina': translateFn('planning.office', 'Oficina'),
    'Pruebas de cámara': translateFn('planning.cameraTests', 'Pruebas de cámara'),
    'Carga': translateFn('planning.loading', 'Carga'),
    'Descarga': translateFn('planning.unloading', 'Descarga'),
    'Localizar': translateFn('planning.location', 'Localizar'),
    'Travel Day': translateFn('planning.travelDay', 'Travel Day'),
    'Prelight': translateFn('planning.prelight', 'Prelight'),
    'Recogida': translateFn('planning.pickup', 'Recogida'),
    'Rodaje Festivo': translateFn('planning.holidayShooting', 'Rodaje Festivo'),
    'Fin': translateFn('planning.end', 'Fin'),
    'Descanso': translateFn('planning.rest', 'Descanso'),
  };
  
  return typeMap[tipo] || tipo;
}

