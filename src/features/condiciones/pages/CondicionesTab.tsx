import CondicionesMensual from '@features/condiciones/condiciones/mensual';
import CondicionesPublicidad from '@features/condiciones/condiciones/publicidad';
import CondicionesSemanal from '@features/condiciones/condiciones/semanal';
import React, { useMemo, useState, useEffect } from 'react';

import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';

type CondicionesTabProps = {
  project?: AnyRecord;
  mode?: string;
  onChange?: (model: AnyRecord) => void;
  readOnly?: boolean;
};

export default function CondicionesTab({ project, mode, onChange = () => {}, readOnly = false }: CondicionesTabProps) {
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

  const btnExportCls = btnExport;
  const btnExportStyle: React.CSSProperties = {
    background: '#f59e0b',
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
          readOnly={readOnly}
        />
      )}

      {effectiveMode === 'mensual' && (
        <CondicionesMensual
          project={project}
          onChange={m => onChange({ mensual: m, tipo: 'mensual' })}
          onRegisterExport={fn => setDoExport(() => fn)}
          readOnly={readOnly}
        />
      )}

      {effectiveMode === 'publicidad' && (
        <CondicionesPublicidad
          project={project}
          onChange={m => onChange({ publicidad: m, tipo: 'publicidad' })}
          onRegisterExport={fn => setDoExport(() => fn)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}


