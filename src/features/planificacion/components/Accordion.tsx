import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ToggleIconButton from '../../../shared/components/ToggleIconButton';

type AccordionProps = {
  title: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onExport: () => void;
  onExportPDF: () => void;
  children: React.ReactNode;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  readOnly?: boolean;
};

export default function Accordion({
  title,
  open,
  onToggle,
  onAdd,
  onExport,
  onExportPDF,
  children,
  btnExportCls,
  btnExportStyle,
  readOnly = false,
}: AccordionProps) {
  const { t } = useTranslation();
  const isPreproduction = title === t('planning.preproduction') || title === 'Preproducción';
  const isProduction = title === t('planning.production') || title === 'Producción';
  
  // Optimizar el handler de toggle para evitar reflows forzados
  const handleToggle = React.useCallback(() => {
    // Usar requestAnimationFrame para diferir el trabajo pesado
    requestAnimationFrame(() => {
      onToggle();
    });
  }, [onToggle]);

  useEffect(() => {
    if (!isProduction) return;
    const handler = () => {
      onAdd();
      try {
        window.dispatchEvent(new CustomEvent('tutorial-planning-week-added'));
      } catch {}
    };
    window.addEventListener('tutorial-planning-add-week', handler as EventListener);
    return () => window.removeEventListener('tutorial-planning-add-week', handler as EventListener);
  }, [isProduction, onAdd]);
  
  return (
    <section className='rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <div className='flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4 gap-1.5 sm:gap-2 md:gap-3'>
        <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
          <ToggleIconButton
            isOpen={open}
            onClick={handleToggle}
            className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8'
          />
          <h4 className='text-brand font-semibold text-xs sm:text-sm md:text-base'>{title}</h4>
        </div>
        <div className='no-pdf flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <button
            className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap'
            style={{...btnExportStyle, background: '#f59e0b'}}
            onClick={onExportPDF}
            title={t('planning.exportSectionPDF')}
          >
            {isPreproduction ? t('planning.pdfPre') : isProduction ? t('planning.pdfPro') : t('planning.pdf')}
          </button>
          <button
            onClick={() => {
              onAdd();
              if (isProduction) {
                try {
                  window.dispatchEvent(new CustomEvent('tutorial-planning-week-added'));
                } catch {}
              }
            }}
            disabled={readOnly}
            data-tutorial={isProduction ? 'planning-add-week' : undefined}
            className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 lg:px-3 lg:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs lg:text-sm border-neutral-border hover:border-[#F59E0B] whitespace-nowrap ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('planning.addWeek')}
          >
            {t('planning.addWeek')}
          </button>
        </div>
      </div>
      {open && <div className='px-2 pb-2 sm:px-3 sm:pb-3 md:px-4 md:pb-4 lg:px-5 lg:pb-5 space-y-2 sm:space-y-3 md:space-y-4'>{children}</div>}
    </section>
  );
}
