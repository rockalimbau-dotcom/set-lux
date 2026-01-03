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
    <div className='flex items-center gap-2 px-5 py-4'>
      <button
        onClick={onToggle}
        disabled={readOnly}
        className={`w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={readOnly ? t('conditions.projectClosed') : (open ? t('reports.collapse') : t('reports.expand'))}
        aria-label={t('reports.weekContent')}
        aria-expanded={open}
        aria-controls={contentId}
        type='button'
      >
        {open ? '−' : '+'}
      </button>
      <h4 className='text-brand font-semibold m-0'>{title || t('reports.week')}</h4>

      <div className='ml-auto flex gap-2'>
        <button
          className={btnExportCls}
          style={{ ...(btnExportStyle || {}), background: '#f59e0b' }}
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
