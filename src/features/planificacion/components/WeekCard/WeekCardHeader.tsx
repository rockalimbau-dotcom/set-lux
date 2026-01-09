import ToggleIconButton from '@shared/components/ToggleIconButton';
import React from 'react';
import { useTranslation } from 'react-i18next';

type WeekCardHeaderProps = {
  weekLabel: string;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  onExportWeekPDF: () => void;
  onDuplicateWeek: () => void;
  onDeleteWeek: () => void;
  btnExportCls?: string;
  btnExportStyle?: React.CSSProperties;
  readOnly?: boolean;
};

export function WeekCardHeader({
  weekLabel,
  open,
  setOpen,
  onExportWeekPDF,
  onDuplicateWeek,
  onDeleteWeek,
  btnExportCls,
  btnExportStyle,
  readOnly = false,
}: WeekCardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className='flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4'>
      <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3'>
        <ToggleIconButton
          isOpen={open}
          onClick={() => setOpen(v => !v)}
          className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8'
        />
        <div className='text-brand font-semibold text-xs sm:text-sm md:text-base'>{weekLabel}</div>
      </div>
      <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
        <button
          className='no-pdf px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold whitespace-nowrap'
          style={{...btnExportStyle, background: '#f59e0b'}}
          onClick={onExportWeekPDF}
          title={t('planning.exportWeekPDF')}
          type='button'
        >
          PDF
        </button>
        <button
          onClick={() => !readOnly && onDuplicateWeek()}
          disabled={readOnly}
          className={`no-pdf px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 lg:px-3 lg:py-2 rounded sm:rounded-md md:rounded-lg border text-[9px] sm:text-[10px] md:text-xs lg:text-sm border-neutral-border hover:border-[#F59E0B] whitespace-nowrap transition ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={readOnly ? t('conditions.projectClosed') : t('planning.duplicateWeek')}
          type='button'
        >
          {t('planning.duplicate')}
        </button>
        <button
          onClick={() => !readOnly && onDeleteWeek()}
          disabled={readOnly}
          className={`no-pdf btn-danger px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 lg:px-2.5 lg:py-2 rounded sm:rounded-md md:rounded-lg border text-white text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={readOnly ? t('conditions.projectClosed') : t('planning.deleteWeek')}
          type='button'
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

