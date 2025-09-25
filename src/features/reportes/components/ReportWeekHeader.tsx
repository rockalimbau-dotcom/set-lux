import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  onToggle: () => void;
  onExport: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  contentId?: string;
};

export default function ReportWeekHeader({
  open,
  title,
  onToggle,
  onExport,
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

      <div className='ml-auto'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={onExport}
          title='Exportar semana'
          type='button'
        >
          Exportar semana
        </button>
      </div>
    </div>
  );
}
