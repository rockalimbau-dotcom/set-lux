import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportPlanButtonProps {
  readOnly?: boolean;
  fileName?: string;
  error?: string;
  isLoading?: boolean;
  onSelectFile: (file: File) => void;
}

export function ImportPlanButton({
  readOnly = false,
  fileName,
  error,
  isLoading = false,
  onSelectFile,
}: ImportPlanButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (readOnly || isLoading) return;
    inputRef.current?.click();
  };

  return (
    <div className='flex flex-col items-end gap-1'>
      <input
        ref={inputRef}
        type='file'
        accept='application/pdf'
        className='hidden'
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          e.currentTarget.value = '';
        }}
      />
      <button
        type='button'
        onClick={handleClick}
        disabled={readOnly || isLoading}
        data-tutorial='planning-upload-plan'
        className='px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded text-[10px] sm:text-xs md:text-sm font-semibold border border-neutral-border text-gray-900 dark:text-white bg-white/80 dark:bg-neutral-panel/80 hover:border-[#F59E0B] transition'
        title={t('planning.uploadShotPlan')}
      >
        {isLoading ? (
          t('planning.importPlanLoading')
        ) : (
          <span className='inline-flex items-center gap-1'>
            <span aria-hidden='true' className='inline-flex'>
              <svg
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M12 16V4' />
                <path d='M8 8l4-4 4 4' />
                <path d='M3 20h18' />
              </svg>
            </span>
            <span>{t('planning.uploadShotPlan')}</span>
          </span>
        )}
      </button>
      {fileName && (
        <div className='text-[9px] sm:text-[10px] md:text-xs text-zinc-500 dark:text-zinc-300'>
          {t('planning.importPlanFileLabel')} {fileName}
        </div>
      )}
      {error && (
        <div className='text-[9px] sm:text-[10px] md:text-xs text-red-500'>
          {error}
        </div>
      )}
    </div>
  );
}
