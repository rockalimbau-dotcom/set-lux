import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import { DayInfo, WeekEntry } from './NecesidadesTabTypes';
import { WeekSection } from './WeekSection';
import { useColumnSwap } from '../../hooks/useColumnSwap';

interface NecesidadesTabContentProps {
  weekEntries: WeekEntry[];
  DAYS: DayInfo[];
  project?: AnyRecord;
  readOnly: boolean;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (
    weekId: string,
    selectedRowKeys?: string[],
    selectedDayIdxs?: number[],
    includeEmptyRows?: boolean
  ) => void;
  addCustomRow: (weekId: string) => string | null;
  updateCustomRowLabel: (weekId: string, rowId: string, label: string) => void;
  removeCustomRow: (weekId: string, rowId: string) => void;
  exportAllNeedsPDF: () => void;
  swapDays: (weekId1: string, dayIdx1: number, weekId2: string, dayIdx2: number) => void;
}

export function NecesidadesTabContent({
  weekEntries,
  DAYS,
  project,
  readOnly,
  setCell,
  removeFromList,
  setWeekOpen,
  exportWeekPDF,
  exportAllNeedsPDF,
  swapDays,
  addCustomRow,
  updateCustomRowLabel,
  removeCustomRow,
}: NecesidadesTabContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Hook compartido para gestión de intercambio de columnas
  const { selectedDay, selectDayForSwap, clearSelection, isDaySelected } = useColumnSwap();

  const btnExportCls = btnExport;
  const btnExportStyle = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  } as React.CSSProperties;

  if (weekEntries.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-8 text-center'>
        <h2 className='text-3xl font-bold mb-4' style={{color: 'var(--text)'}}>
          {t('needs.noWeeksInPlanning')}
        </h2>
        <p className='text-xl max-w-2xl mb-4' style={{color: 'var(--text)', opacity: 0.8}}>
          {t('needs.createWeeksIn')}{' '}
          <button
            onClick={() => {
              if (readOnly) return;
              const projectId = project?.id || project?.nombre;
              const planificacionPath = projectId ? `/project/${projectId}/planificacion` : '/projects';
              navigate(planificacionPath);
            }}
            disabled={readOnly}
            className={`underline font-semibold hover:opacity-80 transition-opacity ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{color: 'var(--brand)'}}
            title={readOnly ? t('conditions.projectClosed') : t('reports.goToPlanning')}
          >
            {t('needs.planning')}
          </button>
          {' '}{t('needs.toAppearHere')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='flex items-center justify-between gap-2 mb-2 sm:mb-3 md:mb-4'>
        <span className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 dark:text-white'>
          <strong>Tip:</strong> {t('planning.scrollTip')}
        </span>
        <button
          className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf'
          style={btnExportStyle}
          onClick={exportAllNeedsPDF}
          title={t('needs.exportAllWeeksPDF')}
        >
          {t('needs.exportFullPDF')}
        </button>
      </div>

      {weekEntries.map(([wid, wk]) => {
        try {
          return (
            <WeekSection
              key={wid}
              wid={wid}
              wk={wk as AnyRecord}
              DAYS={DAYS}
              setCell={setCell}
              removeFromList={removeFromList}
              setWeekOpen={setWeekOpen}
              exportWeekPDF={exportWeekPDF}
              readOnly={readOnly}
              swapDays={swapDays}
              selectedDayForSwap={selectedDay}
              selectDayForSwap={selectDayForSwap}
              clearSelection={clearSelection}
              isDaySelected={isDaySelected}
              weekEntries={weekEntries}
              addCustomRow={addCustomRow}
              updateCustomRowLabel={updateCustomRowLabel}
              removeCustomRow={removeCustomRow}
            />
          );
        } catch (error) {
          console.error(`Error rendering week ${wid}:`, error);
          return (
            <section key={wid} className='rounded-2xl border border-red-800 bg-red-950/30 p-4'>
              <div className='text-red-400 text-sm'>
                {t('needs.errorLoadingWeek', { weekId: wid })}
              </div>
            </section>
          );
        }
      })}
    </>
  );
}

