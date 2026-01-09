import { useTranslation } from 'react-i18next';

export function useSemanalTranslations() {
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
  const translateRoleName = (roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup'): string => {
    // Si el nombre del rol empieza con "REF" seguido de un código (REFG, REFBB, etc.), es un refuerzo
    if (roleName.startsWith('REF') && roleName.length > 3) {
      const baseCode = roleName.substring(3);
      const baseTranslationKey = `team.roles.${baseCode}`;
      const baseTranslated = t(baseTranslationKey);
      const baseLabel = baseTranslated !== baseTranslationKey ? baseTranslated : baseCode;
      // Añadir "Refuerzo" antes del nombre del rol base
      let refuerzoLabel = `Refuerzo ${baseLabel}`;
      // Añadir sufijo según la sección
      if (sectionKey === 'prelight') {
        refuerzoLabel += ' Prelight';
      } else if (sectionKey === 'pickup') {
        refuerzoLabel += ' Recogida';
      }
      return refuerzoLabel;
    }
    
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
      'Rigger': 'RIG',
    };
    
    const roleCode = roleNameToCode[roleName];
    let translated = roleName;
    
    if (roleCode) {
      const translationKey = `team.roles.${roleCode}`;
      const roleTranslated = t(translationKey);
      // Si la traducción existe (no es la clave misma), usarla; si no, usar el nombre original
      translated = roleTranslated !== translationKey ? roleTranslated : roleName;
    }
    
    // Añadir sufijo según la sección
    if (sectionKey === 'prelight') {
      return `${translated} Prelight`;
    } else if (sectionKey === 'pickup') {
      return `${translated} Recogida`;
    }
    
    return translated;
  };

  return { translateHeader, translateRoleName };
}

