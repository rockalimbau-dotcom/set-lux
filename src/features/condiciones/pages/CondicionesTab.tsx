import CondicionesMensual from '@features/condiciones/condiciones/mensual.jsx';
import CondicionesPublicidad from '@features/condiciones/condiciones/publicidad.jsx';
import CondicionesSemanal from '@features/condiciones/condiciones/semanal.jsx';
import React, { useMemo, useState, useEffect } from 'react';

type AnyRecord = Record<string, any>;

type CondicionesTabProps = {
  project?: AnyRecord;
  mode?: string;
  onChange?: (model: AnyRecord) => void;
};

export default function CondicionesTab({ project, mode, onChange = () => {} }: CondicionesTabProps) {
  const effectiveMode = useMemo(() => {
    const v = (mode || (project as AnyRecord)?.conditions?.tipo || 'semanal')
      .toString()
      .toLowerCase();
    return v === 'mensual' || v === 'publicidad' ? v : 'semanal';
  }, [mode, (project as AnyRecord)?.conditions?.tipo]);

  const [doExport, setDoExport] = useState<null | (() => void)>(() => null);
  useEffect(() => {
    setDoExport(() => null);
  }, [effectiveMode]);

  const btnExportCls = 'px-3 py-2 rounded-lg text-sm font-semibold';
  const btnExportStyle: React.CSSProperties = {
    background: '#f97316',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const exportLabel = 'PDF';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-end'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={() => doExport && doExport()}
          title={exportLabel}
          type='button'
        >
          {exportLabel}
        </button>
      </div>

      {effectiveMode === 'semanal' && (
        <CondicionesSemanal
          project={project}
          onChange={m => onChange({ semanal: m, tipo: 'semanal' })}
          onRegisterExport={fn => setDoExport(() => fn)}
        />
      )}

      {effectiveMode === 'mensual' && (
        <CondicionesMensual
          project={project}
          onChange={m => onChange({ mensual: m, tipo: 'mensual' })}
          onRegisterExport={fn => setDoExport(() => fn)}
        />
      )}

      {effectiveMode === 'publicidad' && (
        <CondicionesPublicidad
          project={project}
          onChange={m => onChange({ publicidad: m, tipo: 'publicidad' })}
          onRegisterExport={fn => setDoExport(() => fn)}
        />
      )}
    </div>
  );
}


