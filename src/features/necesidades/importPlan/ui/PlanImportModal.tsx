import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { DayInfo } from '../../pages/NecesidadesTab/NecesidadesTabTypes';
import { WeekSection } from '../../pages/NecesidadesTab/WeekSection';
import { ImportConflict, ImportResult, WeekDecision } from '../types';
import { buildPreviewWeeks } from '../utils/buildPreviewWeeks';

interface PlanImportModalProps {
  open: boolean;
  days: DayInfo[];
  importResult: ImportResult | null;
  conflicts: ImportConflict[];
  decisions: Record<string, WeekDecision>;
  onDecisionChange: (key: string, decision: WeekDecision) => void;
  onConfirm: () => void;
  onCancel: () => void;
  baseRoster?: any[];
}

const noop = () => {};

export function PlanImportModal({
  open,
  days,
  importResult,
  conflicts,
  decisions,
  onDecisionChange,
  onConfirm,
  onCancel,
  baseRoster,
}: PlanImportModalProps) {
  const { t } = useTranslation();

  const { preWeeks, proWeeks } = useMemo(() => {
    const weeks = importResult ? importResult.weeks : [];
    return {
      preWeeks: buildPreviewWeeks(weeks.filter(w => w.scope === 'pre'), baseRoster, true),
      proWeeks: buildPreviewWeeks(weeks.filter(w => w.scope === 'pro'), baseRoster, false),
    };
  }, [importResult, baseRoster]);

  const conflictMap = useMemo(
    () => new Map(conflicts.map(conflict => [conflict.key, conflict])),
    [conflicts]
  );

  const allWeeks = [...preWeeks, ...proWeeks];

  if (!open) return null;

  const modal = (
    <div className='fixed inset-0 z-50 w-screen h-screen bg-black/60 flex items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-6xl bg-white dark:bg-neutral-panel rounded-xl border border-neutral-border shadow-xl overflow-hidden'>
        <div className='px-4 py-3 border-b border-neutral-border flex flex-col gap-2'>
          <div className='text-xs sm:text-sm font-normal text-zinc-900 dark:text-white text-center'>
            {(() => {
              const message = t('planning.importPlanPreviewMessage');
              const splitIndex = message.indexOf(':');
              if (splitIndex === -1) {
                return message;
              }
              const label = message.slice(0, splitIndex + 1);
              const rest = message.slice(splitIndex + 1);
              return (
                <>
                  <span className='font-semibold'>{label}</span>
                  {rest}
                </>
              );
            })()}
          </div>
          {conflicts.length > 0 && (
            <div
              className='rounded-lg border border-neutral-border dark:bg-neutral-panel/60 px-3 py-2 text-[10px] sm:text-xs'
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <div className='font-semibold mb-1 text-zinc-900 dark:text-white'>
                {t('planning.importPlanDetectedWeeks')}
              </div>
              <div className='flex flex-col gap-2'>
                {importResult?.weeks.map(week => {
                  const key = `${week.scope}_${week.startDate}`;
                  const conflict = conflictMap.get(key);
                  if (!conflict) {
                    return (
                      <div key={key} className='flex items-center justify-between gap-2'>
                        <span className='text-zinc-900 dark:text-white'>
                          {week.label || t('planning.week')}
                        </span>
                        <span className='text-emerald-600 dark:text-emerald-300'>
                          {t('planning.importPlanImport')}
                        </span>
                      </div>
                    );
                  }
                  const decision = decisions[key] || 'omit';
                  return (
                    <div key={key} className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-zinc-900 dark:text-white'>
                          {week.label || t('planning.week')}
                        </span>
                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            className={`px-2 py-1 rounded border text-[10px] sm:text-xs ${
                              decision === 'overwrite'
                                ? 'border-red-400 text-red-600'
                                : 'border-neutral-border text-zinc-500'
                            }`}
                            onClick={() => onDecisionChange(key, 'overwrite')}
                          >
                            {t('planning.importPlanOverwrite')}
                          </button>
                          <button
                            type='button'
                            className={`px-2 py-1 rounded border text-[10px] sm:text-xs ${
                              decision === 'omit'
                                ? 'border-neutral-border text-zinc-900 dark:text-zinc-200'
                                : 'border-neutral-border text-zinc-500'
                            }`}
                            onClick={() => onDecisionChange(key, 'omit')}
                          >
                            {t('planning.importPlanOmit')}
                          </button>
                        </div>
                      </div>
                      {decision === 'overwrite' && (
                        <div className='text-[9px] sm:text-[10px] text-red-500'>
                          {t('planning.importPlanOverwriteWarning')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className='max-h-[60vh] overflow-y-auto px-4 py-4 plan-import-preview phase-content'>
          {allWeeks.length === 0 && (
            <div className='text-center text-sm text-zinc-500'>
              {t('planning.importPlanNoData')}
            </div>
          )}
          {preWeeks.length > 0 && (
            <div className='mb-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white'>
              {t('planning.preproduction')}
            </div>
          )}
          {preWeeks.map(week => (
            <div key={`pre_${week.id}`} className='mb-4'>
              <WeekSection
                wid={week.id}
                wk={week as any}
                scope='pre'
                DAYS={days}
                baseRoster={baseRoster}
                readOnly
                setCell={noop}
                setWeekStart={noop}
                removeFromList={noop}
                setWeekOpen={noop}
                exportWeekPDF={noop}
                duplicateWeek={noop}
                deleteWeek={noop}
                swapDays={noop}
                selectedDayForSwap={null}
                selectDayForSwap={noop}
                clearSelection={noop}
                isDaySelected={() => false}
                weekEntries={allWeeks as any}
                addCustomRow={() => null}
                updateCustomRowLabel={noop}
                removeCustomRow={noop}
              />
            </div>
          ))}
          {proWeeks.length > 0 && (
            <div className='mb-2 mt-4 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white'>
              {t('planning.production')}
            </div>
          )}
          {proWeeks.map(week => (
            <div key={`pro_${week.id}`} className='mb-4'>
              <WeekSection
                wid={week.id}
                wk={week as any}
                scope='pro'
                DAYS={days}
                baseRoster={baseRoster}
                readOnly
                setCell={noop}
                setWeekStart={noop}
                removeFromList={noop}
                setWeekOpen={noop}
                exportWeekPDF={noop}
                duplicateWeek={noop}
                deleteWeek={noop}
                swapDays={noop}
                selectedDayForSwap={null}
                selectDayForSwap={noop}
                clearSelection={noop}
                isDaySelected={() => false}
                weekEntries={allWeeks as any}
                addCustomRow={() => null}
                updateCustomRowLabel={noop}
                removeCustomRow={noop}
              />
            </div>
          ))}
        </div>

        <div className='flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-border'>
          <button
            type='button'
            className='px-3 py-2 rounded border border-neutral-border text-sm'
            onClick={onCancel}
          >
            {t('planning.importPlanCancel')}
          </button>
          <button
            type='button'
            className='plan-import-confirm px-3 py-2 rounded text-sm font-semibold text-white'
            onClick={onConfirm}
          >
            {t('planning.importPlanConfirm')}
          </button>
        </div>
      </div>
      <style>{`
        .plan-import-preview .no-pdf {
          display: none !important;
        }
        :root[data-theme='light'] .plan-import-preview textarea,
        :root[data-theme='light'] .plan-import-preview input,
        :root[data-theme='light'] .plan-import-preview select {
          background-color: #fff !important;
          color: #6b7280 !important;
        }
        :root[data-theme='light'] .plan-import-preview textarea::placeholder,
        :root[data-theme='light'] .plan-import-preview input::placeholder {
          color: #9ca3af !important;
        }
        :root[data-theme='light'] .plan-import-preview textarea:not(:placeholder-shown),
        :root[data-theme='light'] .plan-import-preview input:not(:placeholder-shown),
        :root[data-theme='light'] .plan-import-preview input[value]:not([value='']),
        :root[data-theme='light'] .plan-import-preview select:not([value='']) {
          color: #111827 !important;
        }
        :root[data-theme='light'] .plan-import-confirm {
          background-color: #0468BF !important;
        }
        :root[data-theme='dark'] .plan-import-confirm {
          background-color: #F27405 !important;
        }
        :root[data-theme='light'] .plan-import-preview .opacity-50 {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}
