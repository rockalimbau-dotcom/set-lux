import React from 'react';
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
  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90'>
      <div className='flex items-center justify-between px-5 py-4 gap-3'>
        <div className='flex items-center gap-3'>
          <ToggleIconButton
            isOpen={open}
            onClick={onToggle}
            className='w-8 h-8'
          />
          <h4 className='text-brand font-semibold'>{title}</h4>
        </div>
        <div className='no-pdf flex items-center gap-2'>
          <button
            className={btnExportCls}
            style={{...btnExportStyle, background: '#f59e0b'}}
            onClick={onExportPDF}
            title='Exportar sección (PDF)'
          >
            {title === 'Preproducción' ? 'PDF Pre' : title === 'Producción' ? 'PDF Pro' : 'PDF'}
          </button>
          <button
            onClick={onAdd}
            disabled={readOnly}
            className={`px-3 py-2 rounded-lg border text-sm border-neutral-border hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? 'El proyecto está cerrado' : '+ Semana'}
          >
            + Semana
          </button>
        </div>
      </div>
      {open && <div className='px-5 pb-5 space-y-4'>{children}</div>}
    </section>
  );
}
