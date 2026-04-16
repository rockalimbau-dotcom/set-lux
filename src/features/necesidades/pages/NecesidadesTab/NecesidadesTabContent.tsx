import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { DayInfo, NeedsWeek } from './NecesidadesTabTypes';
import { WeekSection } from './WeekSection';
import { useColumnSwap } from '../../hooks/useColumnSwap';
import Accordion from '@shared/components/Accordion';
import EmptyHint from '@shared/components/EmptyHint';
import { ImportPlanButton, PlanImportModal } from '../../importPlan';
import type { ImportConflict, ImportResult, WeekDecision } from '../../importPlan';

interface NecesidadesTabContentProps {
  preEntries: NeedsWeek[];
  proEntries: NeedsWeek[];
  DAYS: DayInfo[];
  readOnly: boolean;
  openPre: boolean;
  openPro: boolean;
  setOpenPre: (value: boolean | ((prev: boolean) => boolean)) => void;
  setOpenPro: (value: boolean | ((prev: boolean) => boolean)) => void;
  baseRoster?: AnyRecord[];
  preRoster?: AnyRecord[];
  pickRoster?: AnyRecord[];
  refsRoster?: AnyRecord[];
  shootingDayOffsets?: Record<string, number>;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  setWeekStart: (weekId: string, date: string) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (
    weekId: string,
    selectedRowKeys?: string[],
    selectedDayIdxs?: number[],
    includeEmptyRows?: boolean
  ) => void;
  addWeek: (scope: 'pre' | 'pro') => void;
  duplicateWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  deleteWeek: (scope: 'pre' | 'pro', weekId: string) => void;
  addCustomRow: (weekId: string) => string | null;
  updateCustomRowLabel: (weekId: string, rowId: string, label: string) => void;
  updateRowLabel: (weekId: string, rowKey: string, label: string) => void;
  removeCustomRow: (weekId: string, rowId: string) => void;
  exportAllNeedsPDF: () => void;
  exportCalendarPDF: (scope: 'pre' | 'pro' | 'all') => void;
  exportScopePDF: (scope: 'pre' | 'pro') => void;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
  onImportPlanFile: (file: File) => void;
  importFileName?: string;
  importError?: string;
  importLoading?: boolean;
  importPreviewOpen?: boolean;
  importResult: ImportResult | null;
  importConflicts: ImportConflict[];
  importDecisions: Record<string, WeekDecision>;
  setImportDecisions: (next: Record<string, WeekDecision>) => void;
  onCloseImportPreview: () => void;
  onConfirmImport: () => void;
}

export function NecesidadesTabContent({
  preEntries,
  proEntries,
  DAYS,
  readOnly,
  openPre,
  openPro,
  setOpenPre,
  setOpenPro,
  baseRoster = [],
  preRoster = [],
  pickRoster = [],
  refsRoster = [],
  shootingDayOffsets = {},
  setCell,
  setWeekStart,
  removeFromList,
  setWeekOpen,
  exportWeekPDF,
  addWeek,
  duplicateWeek,
  deleteWeek,
  exportAllNeedsPDF,
  exportCalendarPDF,
  exportScopePDF,
  swapDays,
  addCustomRow,
  updateCustomRowLabel,
  updateRowLabel,
  removeCustomRow,
  onImportPlanFile,
  importFileName,
  importError,
  importLoading = false,
  importPreviewOpen = false,
  importResult,
  importConflicts,
  importDecisions,
  setImportDecisions,
  onCloseImportPreview,
  onConfirmImport,
}: NecesidadesTabContentProps) {
  const { t } = useTranslation();
  const [calendarScopeOpen, setCalendarScopeOpen] = useState(false);
  const [selectedCalendarScope, setSelectedCalendarScope] = useState<'pre' | 'pro' | 'all' | null>('all');
  const calendarMenuRef = useRef<HTMLDivElement | null>(null);
  const themeGlobal =
    (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  
  // Hook compartido para gestión de intercambio de columnas
  const { selectedDay, selectDayForSwap, clearSelection, isDaySelected } = useColumnSwap();

  const btnExportStyle = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const btnCalendarStyle = {
    background: themeGlobal === 'light' ? '#0468BF' : '#F27405',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const allEntries = [...preEntries, ...proEntries];
  const calendarOptions = [
    {
      key: 'all' as const,
      title: t('common.all', { defaultValue: 'Todo' }),
      description: t('projects.calendarExportAllHint', { defaultValue: 'Exportar preproducción y producción.' }),
    },
    {
      key: 'pre' as const,
      title: t('planning.preproduction', { defaultValue: 'Preproducción' }),
      description: t('projects.calendarExportPreHint', { defaultValue: 'Exportar solo las semanas de preproducción.' }),
    },
    {
      key: 'pro' as const,
      title: t('planning.production', { defaultValue: 'Producción' }),
      description: t('projects.calendarExportProHint', { defaultValue: 'Exportar solo las semanas de producción.' }),
    },
  ];

  useEffect(() => {
    if (!calendarScopeOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!calendarMenuRef.current) return;
      if (!calendarMenuRef.current.contains(event.target as Node)) {
        setCalendarScopeOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [calendarScopeOpen]);

  const renderScope = (
    title: string,
    scope: 'pre' | 'pro',
    entries: NeedsWeek[],
    open: boolean,
    onToggle: () => void
  ) => (
    <Accordion
      title={title}
      open={open}
      onToggle={onToggle}
      onAdd={() => addWeek(scope)}
      onExport={() => {}}
      onExportPDF={() => exportScopePDF(scope)}
      readOnly={readOnly}
    >
      {entries.length === 0 ? (
        <EmptyHint
          title={scope === 'pre' ? t('planning.noPreproductionWeeks') : t('planning.noProductionWeeks')}
          body={scope === 'pre' ? t('planning.preEmptyBody') : t('planning.proEmptyBody')}
          subtext={scope === 'pre' ? t('planning.preEmptySubtext') : t('planning.proEmptySubtext')}
        />
      ) : (
        entries.map((wk, index) => {
          try {
            const wid = wk.id;
            return (
              <WeekSection
                key={wid}
                wid={wid}
                wk={wk as AnyRecord}
                scope={scope}
                DAYS={DAYS}
                baseRoster={baseRoster}
                preRoster={preRoster}
                pickRoster={pickRoster}
                refsRoster={refsRoster}
                shootingDayOffset={shootingDayOffsets[wid] || 0}
                setCell={setCell}
                setWeekStart={setWeekStart}
                removeFromList={removeFromList}
                setWeekOpen={setWeekOpen}
                exportWeekPDF={exportWeekPDF}
                duplicateWeek={duplicateWeek}
                deleteWeek={deleteWeek}
                readOnly={readOnly}
                swapDays={swapDays}
                selectedDayForSwap={selectedDay}
                selectDayForSwap={selectDayForSwap}
                clearSelection={clearSelection}
                isDaySelected={isDaySelected}
                weekEntries={allEntries}
                addCustomRow={addCustomRow}
                updateCustomRowLabel={updateCustomRowLabel}
                updateRowLabel={updateRowLabel}
                removeCustomRow={removeCustomRow}
                tutorialId={scope === 'pro' && index === 0 ? 'planning-week' : undefined}
              />
            );
          } catch (error) {
            console.error(`Error rendering week ${wk.id}:`, error);
            return (
              <section key={wk.id} className='rounded-2xl border border-red-800 bg-red-950/30 p-4'>
                <div className='text-red-400 text-sm'>
                  {t('needs.errorLoadingWeek', { weekId: wk.id })}
                </div>
              </section>
            );
          }
        })
      )}
    </Accordion>
  );

  return (
    <>
      <div className='no-pdf flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2'>
        <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 dark:text-white'>
          <strong>Tip:</strong> {t('planning.scrollTip')}
        </span>
        <div className='flex items-start gap-2'>
          <ImportPlanButton
            readOnly={readOnly}
            fileName={importFileName}
            error={importError}
            isLoading={importLoading}
            onSelectFile={onImportPlanFile}
          />
          <div className='relative z-[10001]' ref={calendarMenuRef}>
            <button
              className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold'
              style={btnCalendarStyle}
              onClick={() => setCalendarScopeOpen(v => !v)}
              title={t('projects.calendarExport', { defaultValue: 'Calendario' })}
              type='button'
            >
              {t('projects.calendarExport', { defaultValue: 'Calendario' })} ▾
            </button>
            {calendarScopeOpen && (
              <div className='absolute right-0 top-full z-[10002] mt-2 w-72 rounded-xl border border-neutral-border bg-white p-3 shadow-lg dark:bg-neutral-panel'>
                <div className='text-xs font-semibold mb-2 text-gray-900 dark:text-zinc-100'>
                  {t('projects.calendarExportSelectorTitle', { defaultValue: 'Selecciona qué exportar' })}
                </div>
                <div className='space-y-1 mb-3'>
                  {calendarOptions.map(option => (
                    <label
                      key={option.key}
                      className='flex items-center gap-2 text-xs text-gray-800 dark:text-zinc-200'
                    >
                      <input
                        type='checkbox'
                        checked={selectedCalendarScope === option.key}
                        onChange={() => setSelectedCalendarScope(option.key)}
                        className='accent-blue-500 dark:accent-[#f59e0b]'
                      />
                      <span>{option.title}</span>
                    </label>
                  ))}
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <button
                    type='button'
                    className='px-2 py-1 rounded border border-neutral-border text-xs text-gray-700 dark:text-zinc-200'
                    onClick={() => setSelectedCalendarScope('all')}
                  >
                    {t('conditions.exportSelectorAll', { defaultValue: 'Tot' })}
                  </button>
                  <button
                    type='button'
                    className='px-2 py-1 rounded border border-neutral-border text-xs text-gray-700 dark:text-zinc-200'
                    onClick={() => setSelectedCalendarScope(null)}
                  >
                    {t('conditions.exportSelectorNone', { defaultValue: 'Res' })}
                  </button>
                  <button
                    type='button'
                    className='px-2 py-1 rounded text-xs font-semibold text-white disabled:opacity-50'
                    style={btnCalendarStyle}
                    disabled={!selectedCalendarScope}
                    onClick={() => {
                      if (!selectedCalendarScope) return;
                      exportCalendarPDF(selectedCalendarScope);
                      setCalendarScopeOpen(false);
                    }}
                  >
                    {t('conditions.exportSelectorAction', { defaultValue: 'Exportar' })}
                  </button>
                </div>
                {selectedCalendarScope && (
                  <div className='mt-2 text-[11px] text-gray-500 dark:text-zinc-400'>
                    {calendarOptions.find(option => option.key === selectedCalendarScope)?.description}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold'
            style={btnExportStyle}
            onClick={exportAllNeedsPDF}
            title={t('needs.exportAllWeeksPDF')}
          >
            {t('planning.pdfFull')}
          </button>
        </div>
      </div>

      {renderScope(t('planning.preproduction'), 'pre', preEntries, openPre, () => setOpenPre(v => !v))}
      {renderScope(t('planning.production'), 'pro', proEntries, openPro, () => setOpenPro(v => !v))}

      <PlanImportModal
        open={importPreviewOpen}
        days={DAYS}
        importResult={importResult}
        conflicts={importConflicts}
        decisions={importDecisions}
        baseRoster={baseRoster}
        onDecisionChange={(key, decision) =>
          setImportDecisions({ ...importDecisions, [key]: decision })
        }
        onCancel={onCloseImportPreview}
        onConfirm={onConfirmImport}
      />
    </>
  );
}
