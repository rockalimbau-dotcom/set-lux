import { useTranslation } from 'react-i18next';
import { AnyRecord } from '@shared/types/common';
import { DayInfo, NeedsWeek } from './NecesidadesTabTypes';
import { WeekSection } from './WeekSection';
import { useColumnSwap } from '../../hooks/useColumnSwap';
import Accordion from '@shared/components/Accordion';
import EmptyHint from '@shared/components/EmptyHint';

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
  removeCustomRow: (weekId: string, rowId: string) => void;
  exportAllNeedsPDF: () => void;
  exportScopePDF: (scope: 'pre' | 'pro') => void;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
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
  exportScopePDF,
  swapDays,
  addCustomRow,
  updateCustomRowLabel,
  removeCustomRow,
}: NecesidadesTabContentProps) {
  const { t } = useTranslation();
  
  // Hook compartido para gestión de intercambio de columnas
  const { selectedDay, selectDayForSwap, clearSelection, isDaySelected } = useColumnSwap();

  const btnExportStyle = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  const allEntries = [...preEntries, ...proEntries];

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
        <button
          className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold'
          style={btnExportStyle}
          onClick={exportAllNeedsPDF}
          title={t('needs.exportAllWeeksPDF')}
        >
          {t('planning.pdfFull')}
        </button>
      </div>

      {renderScope(t('planning.preproduction'), 'pre', preEntries, openPre, () => setOpenPre(v => !v))}
      {renderScope(t('planning.production'), 'pro', proEntries, openPro, () => setOpenPro(v => !v))}
    </>
  );
}

