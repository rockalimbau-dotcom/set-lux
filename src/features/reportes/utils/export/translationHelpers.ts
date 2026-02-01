import i18n from '../../../../i18n/config';

/**
 * Helper to get translation from store - same method as condiciones PDF
 */
export const getTranslation = (key: string, fallback: string): string => {
  try {
    const currentLang = i18n?.language || 'es';
    
    // For specific keys, use direct access like in condiciones PDF
    if (key === 'reports.reports') {
      if (i18n?.store?.data?.[currentLang]?.translation?.reports?.reports) {
        return i18n.store.data[currentLang].translation.reports.reports;
      }
      // Fallback manual
      if (currentLang === 'en') return 'Reports';
      if (currentLang === 'ca') return 'Informes';
      return 'Reportes';
    }
    
    // Access store directly for other keys
    if (i18n?.store?.data?.[currentLang]?.translation) {
      const translations = i18n.store.data[currentLang].translation;
      const keys = key.split('.');
      let value: any = translations;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          break;
        }
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    
    // Fallback: try i18n.t() directly
    const translated = i18n.t(key);
    if (translated && translated !== key && translated.trim() !== '') {
      return translated;
    }
    
    return fallback;
  } catch (error) {
    // Final fallback for reports.reports
    if (key === 'reports.reports') {
      const currentLang = i18n?.language || 'es';
      if (currentLang === 'en') return 'Reports';
      if (currentLang === 'ca') return 'Informes';
      return 'Reportes';
    }
    return fallback;
  }
};

/**
 * Helper function to translate concept names
 */
export const translateConcept = (concepto: string): string => {
  const conceptMap: Record<string, string> = {
    'Horas extra': getTranslation('reports.concepts.extraHours', 'Horas extra'),
    'Turn Around': getTranslation('reports.concepts.turnAround', 'Turn Around'),
    'Nocturnidad': getTranslation('reports.concepts.nightShift', 'Nocturnidad'),
    'Penalty lunch': getTranslation('reports.concepts.penaltyLunch', 'Penalty lunch'),
    'Material propio': getTranslation('reports.concepts.ownMaterial', 'Material propio'),
    'Dietas': getTranslation('reports.concepts.diets', 'Dietas'),
    'Kilometraje': getTranslation('reports.concepts.mileage', 'Kilometraje'),
    'Gasolina': getTranslation('reports.concepts.gasoline', 'Gasolina'),
    'Transporte': getTranslation('reports.concepts.transportation', 'Transporte'),
  };
  return conceptMap[concepto] || concepto;
};

/**
 * Helper function to translate diet item names
 */
export const translateDietItem = (item: string): string => {
  const itemMap: Record<string, string> = {
    'Comida': getTranslation('reports.dietOptions.lunch', 'Comida'),
    'Cena': getTranslation('reports.dietOptions.dinner', 'Cena'),
    'Dieta sin pernoctar': getTranslation('reports.dietOptions.dietNoOvernight', 'Dieta sin pernoctar'),
    'Dieta con pernocta': getTranslation('reports.dietOptions.dietWithOvernight', 'Dieta con pernocta'),
    'Gastos de bolsillo': getTranslation('reports.dietOptions.pocketExpenses', 'Gastos de bolsillo'),
    'Ticket': getTranslation('reports.dietOptions.ticket', 'Ticket'),
  };
  return itemMap[item] || item;
};

/**
 * Helper function to translate day names
 */
export const translateDayName = (dayName: string): string => {
  const dayMap: Record<string, string> = {
    'Lunes': getTranslation('reports.dayNames.monday', 'Lunes'),
    'Martes': getTranslation('reports.dayNames.tuesday', 'Martes'),
    'Miércoles': getTranslation('reports.dayNames.wednesday', 'Miércoles'),
    'Jueves': getTranslation('reports.dayNames.thursday', 'Jueves'),
    'Viernes': getTranslation('reports.dayNames.friday', 'Viernes'),
    'Sábado': getTranslation('reports.dayNames.saturday', 'Sábado'),
    'Domingo': getTranslation('reports.dayNames.sunday', 'Domingo'),
  };
  return dayMap[dayName] || dayName;
};

