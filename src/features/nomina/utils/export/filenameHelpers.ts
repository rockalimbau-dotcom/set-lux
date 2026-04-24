import i18n from '../../../../i18n/config';

/**
 * Generate PDF filename for nomina export
 */
export const generateNominaFilename = (
  project: any,
  monthKey: string,
  monthLabelEs: (key: string, withYear?: boolean) => string,
  options: {
    workerName?: string;
    individual?: boolean;
  } = {}
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
  
  const monthName = monthLabelEs(monthKey, true);
  const monthPart = String(monthName || monthKey)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');

  const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeWorkerName = String(options.workerName || '').trim().replace(/[^a-zA-Z0-9]/g, '_');

  if (options.individual && safeWorkerName) {
    return `${nominaLabel}_${monthPart}_${safeWorkerName}_${safeProjectName}.pdf`;
  }

  return `${nominaLabel}_${monthPart}_${safeProjectName}.pdf`;
};
