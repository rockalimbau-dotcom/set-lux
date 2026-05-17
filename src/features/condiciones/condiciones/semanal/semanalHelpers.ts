import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { getTranslatedConditionRoleLabel } from '../roleCatalog';
import {
  PRICE_KEY_FESTIVO,
  PRICE_KEY_SEXTO_DIA,
  PRICE_KEY_SEXTO_DIA_HALF,
} from '../shared/priceKeys';

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
      [PRICE_KEY_FESTIVO]: t('conditions.priceHoliday'),
      [PRICE_KEY_SEXTO_DIA]: t('conditions.priceSixthDay'),
      [PRICE_KEY_SEXTO_DIA_HALF]: t('conditions.priceSixthDayHalf'),
      'Travel day': t('conditions.travelDay'),
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
