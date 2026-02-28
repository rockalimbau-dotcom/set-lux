import CondicionesMensual from '@features/condiciones/condiciones/mensual';
import CondicionesPublicidad from '@features/condiciones/condiciones/publicidad';
import CondicionesSemanal from '@features/condiciones/condiciones/semanal';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { AnyRecord } from '@shared/types/common';
import {
  DEFAULT_CONDICIONES_EXPORT_SECTIONS,
  type CondicionesExportSections,
} from '@features/condiciones/utils/exportPDF';

type CondicionesTabProps = {
  project?: AnyRecord;
  mode?: string;
  onChange?: (model: AnyRecord) => void;
  readOnly?: boolean;
};

export default function CondicionesTab({ project, mode, onChange = () => {}, readOnly = false }: CondicionesTabProps) {
  const { t } = useTranslation();
  const effectiveMode = useMemo(() => {
    const v = (mode || (project as AnyRecord)?.conditions?.tipo || 'semanal')
      .toString()
      .toLowerCase();
    return v === 'mensual' || v === 'diario' ? v : 'semanal';
  }, [mode, (project as AnyRecord)?.conditions?.tipo]);

  const [doExport, setDoExport] = useState<null | ((sections?: Partial<CondicionesExportSections>) => void)>(() => null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportSections, setExportSections] = useState<CondicionesExportSections>(
    DEFAULT_CONDICIONES_EXPORT_SECTIONS
  );
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDoExport(() => null);
  }, [effectiveMode]);
  useEffect(() => {
    if (!exportMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [exportMenuOpen]);

  const exportLabel = 'PDF';
  const sectionItems: Array<{ key: keyof CondicionesExportSections; label: string }> = [
    { key: 'includeLegend', label: t('conditions.legend') },
    { key: 'includeHolidays', label: t('conditions.holidays') },
    { key: 'includeSchedules', label: t('conditions.schedules') },
    { key: 'includePerDiems', label: t('conditions.perDiems') },
    { key: 'includeTransportation', label: t('conditions.transportation') },
    { key: 'includeAccommodation', label: t('conditions.accommodation') },
    { key: 'includePreProduction', label: t('conditions.preProduction') },
    { key: 'includeAgreement', label: t('conditions.agreement') },
  ];

  const allSelected = sectionItems.every(item => exportSections[item.key]);

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      <div className='flex items-center justify-end relative' ref={exportMenuRef}>
        <button
          className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold text-white border border-white/10 bg-[#0468BF] dark:bg-[#f59e0b]'
          onClick={() => setExportMenuOpen(v => !v)}
          title={exportLabel}
          type='button'
        >
          {exportLabel} ▾
        </button>
        {exportMenuOpen && (
          <div
            className='absolute right-0 top-full mt-2 w-72 rounded-xl border border-neutral-border bg-white dark:bg-neutral-panel shadow-lg p-3 z-50'
          >
            <div className='text-xs font-semibold mb-2 text-gray-900 dark:text-zinc-100'>
              {t('conditions.exportSelectorTitle')}
            </div>
            <div className='space-y-1 mb-3 max-h-64 overflow-auto'>
              {sectionItems.map(item => (
                <label
                  key={item.key}
                  className='flex items-center gap-2 text-xs text-gray-800 dark:text-zinc-200'
                >
                  <input
                    type='checkbox'
                    checked={!!exportSections[item.key]}
                    onChange={() =>
                      setExportSections(prev => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className='accent-blue-500 dark:accent-[#f59e0b]'
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className='flex items-center justify-between gap-2'>
              <button
                type='button'
                className='px-2 py-1 rounded border border-neutral-border text-xs text-gray-700 dark:text-zinc-200'
                onClick={() => setExportSections(DEFAULT_CONDICIONES_EXPORT_SECTIONS)}
              >
                {t('conditions.exportSelectorAll')}
              </button>
              <button
                type='button'
                className='px-2 py-1 rounded border border-neutral-border text-xs text-gray-700 dark:text-zinc-200'
                onClick={() =>
                  setExportSections(prev => {
                    const next = { ...prev };
                    sectionItems.forEach(item => {
                      next[item.key] = false;
                    });
                    return next;
                  })
                }
              >
                {t('conditions.exportSelectorNone')}
              </button>
              <button
                type='button'
                className='btn-export-conditions px-2 py-1 rounded text-xs font-semibold text-white disabled:opacity-50'
                disabled={!doExport || !sectionItems.some(item => exportSections[item.key])}
                onClick={() => {
                  if (!doExport) return;
                  if (!sectionItems.some(item => exportSections[item.key])) return;
                  doExport({ ...exportSections, includePricesTable: true });
                  setExportMenuOpen(false);
                }}
              >
                {t('conditions.exportSelectorAction')}
              </button>
            </div>
            {!allSelected && (
              <div className='mt-2 text-[11px] text-gray-500 dark:text-zinc-400'>
                {t('conditions.exportSelectorHint')}
              </div>
            )}
          </div>
        )}
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

      {effectiveMode === 'diario' && (
        <CondicionesPublicidad
          project={project}
          onChange={m => onChange({ diario: m, tipo: 'diario' })}
          onRegisterExport={fn => setDoExport(() => fn)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
