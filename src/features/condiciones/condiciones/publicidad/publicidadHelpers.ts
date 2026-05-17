import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { getTranslatedConditionRoleLabel } from '../roleCatalog';
import { PRICE_KEY_FESTIVO } from '../shared/priceKeys';

export function useDiarioTranslations(project?: AnyRecord | null) {
  const { t } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio 1/2 jornada': t('conditions.priceHalfDay'),
      'Material propio': t('conditions.priceOwnMaterial'),
      [PRICE_KEY_FESTIVO]: t('conditions.priceHoliday'),
      'Travel day': t('conditions.travelDay'),
      'Localización técnica': t('conditions.technicalLocation'),
      'Carga/descarga': t('conditions.loadingUnloading'),
      'Horas extras': t('conditions.extraHours'),
    };
    return headerMap[header] || header;
  };

  // Función helper para traducir nombres de roles
  const translateRoleName = (roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup'): string => {
    return getTranslatedConditionRoleLabel(project, roleName, sectionKey, t);
  };

  return { translateHeader, translateRoleName };
}
