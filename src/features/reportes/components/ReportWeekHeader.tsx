import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  title?: string;
  onToggle: () => void;
  onExportHTML: () => void;
  onExportPDF: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  contentId?: string;
  readOnly?: boolean;
};

export default function ReportWeekHeader({
  open,
  title,
  onToggle,
  onExportHTML,
  onExportPDF,
  btnExportCls,
  btnExportStyle,
  contentId,
  readOnly = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className='flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4'>
      <button
        onClick={onToggle}
        disabled={readOnly}
        className={`w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-md md:rounded-lg border border-neutral-border flex items-center justify-center text-xs sm:text-sm hover:border-accent ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={readOnly ? t('conditions.projectClosed') : (open ? t('reports.collapse') : t('reports.expand'))}
        aria-label={t('reports.weekContent')}
        aria-expanded={open}
        aria-controls={contentId}
        type='button'
      >
        {open ? '−' : '+'}
      </button>
      <h4 className='text-brand font-semibold m-0 text-xs sm:text-sm md:text-base'>{title || t('reports.week')}</h4>

      <div className='ml-auto flex gap-1.5 sm:gap-2'>
        <button
          className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf`}
          style={{ ...(btnExportStyle || {}), background: '#f59e0b', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={onExportPDF}
          title={t('reports.exportWeekPDF')}
          type='button'
        >
          PDF
        </button>
      </div>
    </div>
  );
}
