import { useTranslation } from 'react-i18next';

export function useMensualTranslations() {
  const { t } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio mensual': t('conditions.priceMonthly'),
      'Precio semanal': t('conditions.priceWeekly'),
      'Precio diario': t('conditions.priceDaily'),
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio refuerzo': t('conditions.priceReinforcement'),
      'Precio Día extra/Festivo': t('conditions.priceExtraDayHoliday'),
      'Travel day': t('conditions.travelDay'),
      'Horas extras': t('conditions.extraHours'),
    };
    return headerMap[header] || header;
  };

  // Función helper para traducir nombres de roles
  const translateRoleName = (roleName: string): string => {
    // Mapeo de nombres de roles en español a códigos
    const roleNameToCode: Record<string, string> = {
      'Gaffer': 'G',
      'Best boy': 'BB',
      'Eléctrico': 'E',
      'Auxiliar': 'AUX',
      'Meritorio': 'M',
      'Técnico de mesa': 'TM',
      'Finger boy': 'FB',
      'Refuerzo': 'REF',
    };
    
    const roleCode = roleNameToCode[roleName];
    if (roleCode) {
      const translationKey = `team.roles.${roleCode}`;
      const translated = t(translationKey);
      // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
      return translated !== translationKey ? translated : roleName;
    }
    return roleName;
  };

  return { translateHeader, translateRoleName };
}

