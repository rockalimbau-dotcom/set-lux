import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { btnExport } from '@shared/utils/tailwindClasses';
import { storage } from '@shared/services/localStorage.service';

type MonthSectionHeaderProps = {
  monthLabel: string;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  projectMode?: 'semanal' | 'mensual' | 'diario';
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const btnExportCls = btnExport;
  const btnExportStyle: React.CSSProperties = {
    background: '#f59e0b',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4'>
      <div className='flex items-center gap-2 sm:gap-3'>
        <button
          onClick={() => !readOnly && setOpen(v => !v)}
          disabled={readOnly}
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded sm:rounded-md md:rounded-lg border border-neutral-border flex items-center justify-center text-xs sm:text-sm hover:border-[#F59E0B] ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={readOnly ? t('conditions.projectClosed') : (open ? t('payroll.collapse') : t('payroll.expand'))}
          type='button'
        >
          {open ? '−' : '+'}
        </button>
        <span className='text-xs sm:text-sm md:text-base font-semibold text-brand'>
          {t('payroll.payrollTitle')} {monthLabel}
        </span>
        <button
          type='button'
          onClick={() => setIsHelpOpen(true)}
          className='w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-neutral-border text-[10px] sm:text-xs font-semibold hover:border-[var(--hover-border)]'
          title={t('payroll.understandPayroll')}
        >
          ?
        </button>
      </div>
      <div className='flex flex-wrap items-center gap-2 sm:gap-2 md:gap-4 w-full sm:w-auto sm:ml-auto'>
        {(projectMode === 'semanal' || projectMode === 'mensual') && (
          <>
            {projectMode === 'mensual' && (
              <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
                <label className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 whitespace-nowrap'>{t('payroll.priceTo')}</label>
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
                  className={`w-10 sm:w-12 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-2 md:py-1 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={readOnly ? t('conditions.projectClosed') : t('payroll.priceToDays')}
                />
                <label className='text-[9px] sm:text-[10px] md:text-xs text-zinc-400 whitespace-nowrap'>{t('payroll.days')}</label>
              </div>
            )}
            <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
              <label className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-300 whitespace-nowrap'>{t('payroll.from')}</label>
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
                className={`w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? t('conditions.projectClosed') : t('payroll.dateFrom')}
              />
            </div>
            <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
              <label className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-300 whitespace-nowrap'>{t('payroll.to')}</label>
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
                className={`w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={readOnly ? t('conditions.projectClosed') : t('payroll.dateTo')}
              />
            </div>
          </>
        )}
        <button
          className='ml-auto lg:ml-0 px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf'
          style={{ background: '#f59e0b', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.08)' }}
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
      {isHelpOpen && (
        <div className='fixed inset-0 bg-black/60 grid place-items-center p-6 z-50'>
          <div
            className='w-full max-w-[720px] rounded sm:rounded-md md:rounded-lg border border-neutral-border p-3 sm:p-4'
            style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
          >
            <div className='flex items-center justify-between gap-2 mb-2'>
              <h3 className='text-[11px] sm:text-xs md:text-sm font-semibold' style={{ color: 'var(--brand)' }}>
                {t('payroll.understandPayroll')}
              </h3>
              <button
                type='button'
                onClick={() => setIsHelpOpen(false)}
                className='px-2 py-1 rounded-md border border-neutral-border text-[9px] sm:text-[10px] md:text-xs'
              >
                {t('common.close')}
              </button>
            </div>
            <div className='w-full max-h-[75vh] overflow-auto rounded border border-neutral-border bg-white/5 p-2'>
              <a href='/Como_entender_nomina.png' target='_blank' rel='noreferrer'>
                <img
                  src='/Como_entender_nomina.png'
                  alt={t('payroll.understandPayrollAlt')}
                  className='w-full h-auto rounded'
                />
              </a>
            </div>
            <div className='mt-2 space-y-1 text-[9px] sm:text-[10px] md:text-xs' style={{ color: 'var(--text)' }}>
              {[
                { color: '#F9A8D4', label: t('payroll.legendBase'), detail: t('payroll.legendBaseDetail') },
                { color: '#FDE68A', label: t('payroll.legendTransport') },
                { color: '#86EFAC', label: t('payroll.legendDietas') },
                { color: '#93C5FD', label: t('payroll.legendExtras') },
                { color: '#FDBA74', label: t('payroll.legendBruto') },
              ].map(item => (
                <div key={item.label} className='flex items-center gap-2'>
                  <span
                    className='inline-block rounded-sm border border-neutral-border'
                    style={{ backgroundColor: item.color, width: '14px', height: '14px', minWidth: '14px' }}
                  />
                  <span>
                    {item.label}
                    {item.detail && (
                      <span className='ml-1 text-[8px] sm:text-[9px] md:text-[10px] opacity-80'>
                        {item.detail}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

