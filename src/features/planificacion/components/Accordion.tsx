import React from 'react';
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
  
  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <div className='flex items-center justify-between px-5 py-4 gap-3'>
        <div className='flex items-center gap-3'>
          <ToggleIconButton
            isOpen={open}
            onClick={handleToggle}
            className='w-8 h-8'
          />
          <h4 className='text-brand font-semibold'>{title}</h4>
        </div>
        <div className='no-pdf flex items-center gap-2'>
          <button
            className={btnExportCls}
            style={{...btnExportStyle, background: '#f59e0b'}}
            onClick={onExportPDF}
            title={t('planning.exportSectionPDF')}
          >
            {isPreproduction ? t('planning.pdfPre') : isProduction ? t('planning.pdfPro') : t('planning.pdf')}
          </button>
          <button
            onClick={onAdd}
            disabled={readOnly}
            className={`px-3 py-2 rounded-lg border text-sm border-neutral-border hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('planning.addWeek')}
          >
            {t('planning.addWeek')}
          </button>
        </div>
      </div>
      {open && <div className='px-5 pb-5 space-y-4'>{children}</div>}
    </section>
  );
}
