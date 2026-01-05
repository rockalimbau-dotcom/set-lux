import React from 'react';
import { useTranslation } from 'react-i18next';
import { btnExport } from '@shared/utils/tailwindClasses';
import { storage } from '@shared/services/localStorage.service';

type MonthSectionHeaderProps = {
  monthLabel: string;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  projectMode?: 'semanal' | 'mensual' | 'publicidad';
  priceDays: number;
  setPriceDays: (value: number | ((prev: number) => number)) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  dateRangeKey: string;
  onExportPDF: () => void | Promise<void>;
  readOnly?: boolean;
};

export function MonthSectionHeader({
  monthLabel,
  open,
  setOpen,
  projectMode,
  priceDays,
  setPriceDays,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  dateRangeKey,
  onExportPDF,
  readOnly = false,
}: MonthSectionHeaderProps) {
  const { t } = useTranslation();

  const btnExportCls = btnExport;
  const btnExportStyle: React.CSSProperties = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className='flex items-center gap-2 px-5 py-4'>
      <button
        onClick={() => !readOnly && setOpen(v => !v)}
        disabled={readOnly}
        className={`w-6 h-6 rounded-lg border border-neutral-border flex items-center justify-center text-sm hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={readOnly ? t('conditions.projectClosed') : (open ? t('payroll.collapse') : t('payroll.expand'))}
        type='button'
      >
        {open ? '−' : '+'}
      </button>
      <span className='text-lg font-semibold text-brand'>
        {t('payroll.payrollTitle')} {monthLabel}
      </span>
      {(projectMode === 'semanal' || projectMode === 'mensual') && (
        <div className='ml-auto flex items-center gap-3'>
          {projectMode === 'mensual' && (
            <div className='flex items-center gap-2'>
              <label className='text-xs text-zinc-400 whitespace-nowrap'>{t('payroll.priceTo')}</label>
              <input
                type='number'
                min='28'
                max='31'
                value={priceDays}
                onChange={e => {
                  if (readOnly) return;
                  const val = parseInt(e.target.value, 10);
                  if (val >= 28 && val <= 31) {
                    setPriceDays(val);
                  }
                }}
                disabled={readOnly}
                readOnly={readOnly}
                className={`w-12 px-2 py-1 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-xs text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? t('conditions.projectClosed') : t('payroll.priceToDays')}
              />
              <label className='text-xs text-zinc-400 whitespace-nowrap'>{t('payroll.days')}</label>
            </div>
          )}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('payroll.from')}</label>
            <input
              type='date'
              value={dateFrom}
              onChange={e => {
                if (readOnly) return;
                const newValue = e.target.value;
                setDateFrom(newValue);
                storage.setString(`${dateRangeKey}_from`, newValue);
                window.dispatchEvent(
                  new CustomEvent('localStorageChange', {
                    detail: { key: `${dateRangeKey}_from`, value: newValue },
                  })
                );
              }}
              disabled={readOnly}
              readOnly={readOnly}
              className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('payroll.dateFrom')}
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('payroll.to')}</label>
            <input
              type='date'
              value={dateTo}
              onChange={e => {
                if (readOnly) return;
                const newValue = e.target.value;
                setDateTo(newValue);
                storage.setString(`${dateRangeKey}_to`, newValue);
                window.dispatchEvent(
                  new CustomEvent('localStorageChange', {
                    detail: { key: `${dateRangeKey}_to`, value: newValue },
                  })
                );
              }}
              disabled={readOnly}
              readOnly={readOnly}
              className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={readOnly ? t('conditions.projectClosed') : t('payroll.dateTo')}
            />
          </div>
        </div>
      )}
      <div className='ml-auto flex gap-2'>
        <button
          className={btnExportCls}
          style={btnExportStyle}
          onClick={() => {
            if (!readOnly) {
              onExportPDF();
            }
          }}
          disabled={readOnly}
          title={readOnly ? t('conditions.projectClosed') : t('payroll.exportPDF')}
          type='button'
        >
          PDF
        </button>
      </div>
    </div>
  );
}

