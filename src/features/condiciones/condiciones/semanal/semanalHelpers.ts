import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { getConditionRoleLabel } from '../roleCatalog';

export function useSemanalTranslations(project?: AnyRecord | null) {
  const { t } = useTranslation();
  
  // Función helper para traducir headers de precios
  const translateHeader = (header: string): string => {
    const headerMap: Record<string, string> = {
      'Precio mensual': t('conditions.priceMonthly'),
      'Precio semanal': t('conditions.priceWeekly'),
      'Precio diario': t('conditions.priceDaily'),
      'Precio jornada': t('conditions.priceWorkDay'),
      'Precio 1/2 jornada': t('conditions.priceHalfDay'),
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
    return getConditionRoleLabel(project, roleName, sectionKey);
  };

  return { translateHeader, translateRoleName };
}
