import Button from '@shared/components/Button';
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
    <div className='flex items-center justify-between gap-3 px-5 py-4'>
      <div className='flex items-center gap-3'>
        <ToggleIconButton
          isOpen={open}
          onClick={() => setOpen(v => !v)}
          className='w-8 h-8'
        />
        <div className='text-brand font-semibold'>{weekLabel}</div>
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='export'
          size='sm'
          className={`no-pdf ${btnExportCls || ''}`}
          style={{...btnExportStyle, background: '#f59e0b'}}
          onClick={onExportWeekPDF}
          title={t('planning.exportWeekPDF')}
        >
          PDF
        </Button>
        <Button
          variant='duplicate'
          size='sm'
          className={`no-pdf ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !readOnly && onDuplicateWeek()}
          disabled={readOnly}
          title={readOnly ? t('conditions.projectClosed') : t('planning.duplicateWeek')}
          type='button'
        >
          {t('planning.duplicate')}
        </Button>
        <Button
          variant='danger'
          size='sm'
          className={`no-pdf ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !readOnly && onDeleteWeek()}
          disabled={readOnly}
          title={readOnly ? t('conditions.projectClosed') : t('planning.deleteWeek')}
          type='button'
        >
          🗑️
        </Button>
      </div>
    </div>
  );
}

