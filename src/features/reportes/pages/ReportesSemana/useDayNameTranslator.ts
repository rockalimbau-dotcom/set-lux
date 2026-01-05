import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dayNameFromISO } from '@shared/utils/date';
import { DAY_NAMES } from '../../constants';

/**
 * Hook to create a day name translator function
 */
export function useDayNameTranslator() {
  const { t } = useTranslation();

  return useMemo(
    () => (iso: string, i: number) => {
      const dayIndex = dayNameFromISO(iso, i, [...DAY_NAMES] as any);
      const dayMap: Record<string, string> = {
        'Lunes': t('reports.dayNames.monday'),
        'Martes': t('reports.dayNames.tuesday'),
        'Miércoles': t('reports.dayNames.wednesday'),
        'Jueves': t('reports.dayNames.thursday'),
        'Viernes': t('reports.dayNames.friday'),
        'Sábado': t('reports.dayNames.saturday'),
        'Domingo': t('reports.dayNames.sunday'),
      };
      return dayMap[dayIndex] || dayIndex;
    },
    [t]
  );
}

