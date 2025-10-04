import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  onToggle: () => void;
  onExportHTML: () => void;
  onExportPDF: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  contentId?: string;
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
}: Props) {
  return (
    <div className='flex items-center gap-2 px-5 py-4'>
      <button
        onClick={onToggle}
        className='w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-accent'
        title={open ? 'Contraer' : 'Desplegar'}
        aria-label='Alternar semana'
        aria-expanded={open}
        aria-controls={contentId}
        type='button'
      >
        {open ? '−' : '+'}
      </button>
      <h4 className='text-brand font-semibold m-0'>{title || 'Semana'}</h4>

      <div className='ml-auto flex gap-2'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={onExportHTML}
          title='Exportar semana (HTML)'
          type='button'
        >
          HTML
        </button>
        <button
          className={btnExportCls}
          style={{ ...(btnExportStyle || {}), background: '#f97316' }}
          onClick={onExportPDF}
          title='Exportar semana (PDF)'
          type='button'
        >
          PDF
        </button>
      </div>
    </div>
  );
}
