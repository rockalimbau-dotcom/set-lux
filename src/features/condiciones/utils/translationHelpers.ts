import i18n from '../../../i18n/config';

/**
 * Función helper para normalizar texto para comparación
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ').replace(/\n+/g, '\n');
};

/**
 * Función para obtener todos los textos por defecto de todos los idiomas
 */
const getAllDefaultTexts = (key: string): string[] => {
  const languages = ['es', 'en', 'ca'];
  return languages.map(lang => {
    try {
      // Usar i18n.t con el parámetro lng para obtener el texto en el idioma específico
      const text = i18n.t(key, { lng: lang });
      return normalizeText(text);
    } catch {
      return '';
    }
  });
};

/**
 * Función para verificar si un texto es un texto por defecto de cualquier idioma
 */
const isDefaultText = (currentText: string, translationKey: string): boolean => {
  if (!currentText || currentText.trim() === '') return true;
  
  const normalizedCurrent = normalizeText(currentText);
  const defaultTexts = getAllDefaultTexts(translationKey);
  
  return defaultTexts.some(defaultText => normalizedCurrent === defaultText);
};

/**
 * Funciones para obtener textos por defecto traducidos
 * Estas funciones se usan fuera de componentes React, por lo que usan i18n directamente
 */

// Funciones comunes a todos los modos
const getDefaultTransportes = () => i18n.t('conditions.defaultTransportation');
export const getDefaultAlojamiento = () => i18n.t('conditions.defaultAccommodation');
export const getDefaultConvenio = () => i18n.t('conditions.defaultAgreement');
// Función genérica para prepro (usada en mensual y semanal, no en publicidad)
export const getDefaultPrepro = () => i18n.t('conditions.defaultPreProduction');

// Funciones específicas por modo
const getDefaultLegendMensual = () => i18n.t('conditions.defaultLegendMonthly');
const getDefaultHorariosMensual = () => i18n.t('conditions.defaultSchedules');
const getDefaultDietasMensual = () => i18n.t('conditions.defaultPerDiems');
const getDefaultPreproMensual = () => i18n.t('conditions.defaultPreProduction');

const getDefaultLegendSemanal = () => i18n.t('conditions.defaultLegendWeekly');
const getDefaultHorariosSemanal = () => i18n.t('conditions.defaultSchedules');
const getDefaultDietasSemanal = () => i18n.t('conditions.defaultPerDiems');
const getDefaultPreproSemanal = () => i18n.t('conditions.defaultPreProduction');

const getDefaultLegendPublicidad = () => i18n.t('conditions.defaultLegendAdvertising');
const getDefaultHorariosPublicidad = () => i18n.t('conditions.defaultSchedulesAdvertising');
const getDefaultDietasPublicidad = () => i18n.t('conditions.defaultPerDiemsAdvertising');

// Funciones de conveniencia para cada modo
export const getDefaultsMensual = () => ({
  legend: getDefaultLegendMensual(),
  horarios: getDefaultHorariosMensual(),
  dietas: getDefaultDietasMensual(),
  transportes: getDefaultTransportes(),
  alojamiento: getDefaultAlojamiento(),
  prepro: getDefaultPreproMensual(),
  convenio: getDefaultConvenio(),
});

export const getDefaultsSemanal = () => ({
  legend: getDefaultLegendSemanal(),
  horarios: getDefaultHorariosSemanal(),
  dietas: getDefaultDietasSemanal(),
  transportes: getDefaultTransportes(),
  alojamiento: getDefaultAlojamiento(),
  prepro: getDefaultPreproSemanal(),
  convenio: getDefaultConvenio(),
});

export const getDefaultsPublicidad = () => ({
  legend: getDefaultLegendPublicidad(),
  horarios: getDefaultHorariosPublicidad(),
  dietas: getDefaultDietasPublicidad(),
  transportes: getDefaultTransportes(),
  alojamiento: getDefaultAlojamiento(),
  convenio: getDefaultConvenio(),
});

