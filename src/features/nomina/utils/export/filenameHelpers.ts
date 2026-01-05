import i18n from '../../../../i18n/config';

/**
 * Generate PDF filename for nomina export
 */
export const generateNominaFilename = (
  project: any,
  monthKey: string,
  monthLabelEs: (key: string, withYear?: boolean) => string
): string => {
  const projectName = project?.nombre || i18n.t('common.project');
  const currentLang = i18n?.language || 'es';
  let nominaLabel = 'Nómina';
  if (i18n?.store?.data?.[currentLang]?.translation?.payroll?.payrollTitle) {
    nominaLabel = i18n.store.data[currentLang].translation.payroll.payrollTitle;
  } else {
    if (currentLang === 'en') nominaLabel = 'Payroll';
    else if (currentLang === 'ca') nominaLabel = 'Nòmina';
  }
  
  let monthPart = '';
  try {
    const [year, month] = monthKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, 1);
    const monthName = dateObj.toLocaleDateString(currentLang, { month: 'long' });
    const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    monthPart = monthCapitalized.replace(/[^a-zA-Z0-9]/g, '');
  } catch (e) {
    const monthName = monthLabelEs(monthKey, true);
    monthPart = monthName.replace(/[^a-zA-Z0-9]/g, '');
  }
  
  return `${nominaLabel}_${monthPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
};

