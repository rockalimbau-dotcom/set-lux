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
      'Material propio': t('conditions.priceOwnMaterial'),
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
      // Extraer el código del rol base (G, BB, E, etc.)
      const baseRoleCode = roleName.substring(3);
      const roleNameToCode: Record<string, string> = {
        'G': 'G',
        'BB': 'BB',
        'E': 'E',
        'AUX': 'AUX',
        'M': 'M',
        'TM': 'TM',
        'FB': 'FB',
      };
      const code = roleNameToCode[baseRoleCode] || baseRoleCode;
      const translationKey = `team.roles.${code}`;
      const baseLabel = t(translationKey) !== translationKey ? t(translationKey) : baseRoleCode;
      
      // Añadir prefijo de refuerzo antes del nombre del rol base
      let refuerzoLabel = `${t('team.reinforcementPrefix')} ${baseLabel}`;
      
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
      'Rigging Gaffer': 'RG',
      'Rigging Best Boy': 'RBB',
      'Rigging Eléctrico': 'RE',
      'Eléctrico': 'E',
      'Auxiliar': 'AUX',
      'Meritorio': 'M',
      'Técnico de mesa': 'TM',
      'Finger boy': 'FB',
      'Técnico de Generador': 'TG',
      'Grupista eléctrico': 'TG',
      'Chofer eléctrico': 'CE',
      'Eléctrico de potencia': 'EPO',
      'Técnico de prácticos': 'TP',
      'Refuerzo': 'REF',
    };
    
    const roleCode = roleNameToCode[roleName];
    if (roleCode) {
      const translationKey = `team.roles.${roleCode}`;
      const translated = t(translationKey);
      // Si la traducción existe (no es la clave misma), devolverla; si no, devolver el nombre original
      let result = translated !== translationKey ? translated : roleName;
      
      // Añadir sufijo según la sección
      if (sectionKey === 'prelight') {
        result += ' Prelight';
      } else if (sectionKey === 'pickup') {
        result += ' Recogida';
      }
      
      return result;
    }
    return roleName;
  };

  return { translateHeader, translateRoleName };
}

