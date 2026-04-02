import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { getConditionRoleLabel } from '../roleCatalog';

export function useDiarioTranslations(project?: AnyRecord | null) {
  const { t } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio 1/2 jornada': t('conditions.priceHalfDay'),
      'Material propio': t('conditions.priceOwnMaterial'),
      'Precio Día extra/Festivo': t('conditions.priceExtraDayHoliday'),
      'Travel day': t('conditions.travelDay'),
      'Localización técnica': t('conditions.technicalLocation'),
      'Carga/descarga': t('conditions.loadingUnloading'),
      'Horas extras': t('conditions.extraHours'),
    };
    return headerMap[header] || header;
  };

  // Función helper para traducir nombres de roles
  const translateRoleName = (roleName: string, sectionKey?: 'base' | 'prelight' | 'pickup'): string => {
    return getConditionRoleLabel(project, roleName, sectionKey);
  };

  return { translateHeader, translateRoleName };
}
