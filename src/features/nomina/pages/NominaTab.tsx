import NominaMensual from '@features/nomina/nominas/NominaMensual';
import NominaSemanal from '@features/nomina/nominas/NominaSemanal';
import NominaPublicidad from '@features/nomina/nominas/NominaPublicidad';
import { AnyRecord } from '@shared/types/common';
import { useTranslation } from 'react-i18next';

interface NominaTabProps extends AnyRecord {
  project?: any;
  mode?: 'semanal' | 'mensual' | 'diario';
  readOnly?: boolean;
}

export default function NominaTab({ project, mode, readOnly = false, ...props }: NominaTabProps) {
  const { t } = useTranslation();

  // Usar el componente específico según el modo
  if (mode === 'diario') {
    return (
      <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
        <div className='no-pdf'>
          <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 dark:text-white'>
            <strong>Tip:</strong> {t('payroll.scrollTip')}
          </span>
        </div>
        <NominaPublicidad project={project} readOnly={readOnly} {...props} />
      </div>
    );
  }
  
  if (mode === 'semanal') {
    return (
      <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
        <div className='no-pdf'>
          <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 dark:text-white'>
            <strong>Tip:</strong> {t('payroll.scrollTip')}
          </span>
        </div>
        <NominaSemanal project={project} readOnly={readOnly} {...props} />
      </div>
    );
  }
  
  // Por defecto, usar NominaMensual para mensual
  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      <div className='no-pdf'>
        <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 dark:text-white'>
          <strong>Tip:</strong> {t('payroll.scrollTip')}
        </span>
      </div>
      <NominaMensual project={project} readOnly={readOnly} {...props} />
    </div>
  );
}

