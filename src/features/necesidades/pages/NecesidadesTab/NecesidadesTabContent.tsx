import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnyRecord } from '@shared/types/common';
import { btnExport } from '@shared/utils/tailwindClasses';
import { DayInfo, WeekEntry } from './NecesidadesTabTypes';
import { WeekSection } from './WeekSection';

interface NecesidadesTabContentProps {
  weekEntries: WeekEntry[];
  DAYS: DayInfo[];
  project?: AnyRecord;
  readOnly: boolean;
  setCell: (weekId: string, dayIdx: number, fieldKey: string, value: unknown) => void;
  removeFromList: (weekId: string, dayIdx: number, listKey: string, idx: number) => void;
  setWeekOpen: (weekId: string, isOpen: boolean) => void;
  exportWeekPDF: (weekId: string) => void;
  exportAllNeedsPDF: () => void;
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
}: NecesidadesTabContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      <div className='flex items-center justify-end gap-2'>
        <button
          className={btnExportCls}
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

