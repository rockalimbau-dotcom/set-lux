// Helper function to get translated day name
export const getDayName = (key: string, t: (key: string) => string): string => {
  const dayMap: Record<string, string> = {
    'mon': t('planning.monday'),
    'tue': t('planning.tuesday'),
    'wed': t('planning.wednesday'),
    'thu': t('planning.thursday'),
    'fri': t('planning.friday'),
    'sat': t('planning.saturday'),
    'sun': t('planning.sunday'),
  };
  return dayMap[key] || key;
};

export const DAYS = [
  { idx: 0, key: 'mon', name: 'Lunes' },
  { idx: 1, key: 'tue', name: 'Martes' },
  { idx: 2, key: 'wed', name: 'Miércoles' },
  { idx: 3, key: 'thu', name: 'Jueves' },
  { idx: 4, key: 'fri', name: 'Viernes' },
  { idx: 5, key: 'sat', name: 'Sábado' },
  { idx: 6, key: 'sun', name: 'Domingo' },
];

