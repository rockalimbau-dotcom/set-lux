import React from 'react';
import { useTranslation } from 'react-i18next';
import { MonthReportGroupHeaderProps } from './MonthReportGroupHeaderTypes';

export function MonthReportGroupHeader({
  monthName,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  readOnly,
  handleExportPDF,
  horasExtraOpciones,
  displayedHorasExtraTipo,
  setHorasExtraTipo,
  theme,
  focusColor,
  isDropdownOpen,
  setIsDropdownOpen,
  hoveredOption,
  setHoveredOption,
  isButtonHovered,
  setIsButtonHovered,
  dropdownRef,
}: MonthReportGroupHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className='flex items-center gap-4 p-4 bg-neutral-panel/50 rounded-lg border border-neutral-border'>
      <span className='text-lg font-semibold text-brand'>{monthName}</span>
      <div className='ml-auto flex items-center gap-4'>
        <div className='flex items-center gap-2 mr-6 relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onBlur={() => setIsButtonHovered(false)}
            className={`px-3 py-2 rounded-lg border focus:outline-none text-sm w-full min-w-[280px] text-left transition-colors ${
              theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'
            } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.selectExtraHoursType')}
            style={{
              borderWidth: isButtonHovered ? '1.5px' : '1px',
              borderStyle: 'solid',
              borderColor:
                isButtonHovered && theme === 'light'
                  ? '#0476D9'
                  : isButtonHovered && theme === 'dark'
                  ? '#fff'
                  : 'var(--border)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              paddingRight: '2.5rem',
            }}
          >
            {displayedHorasExtraTipo}
          </button>
          {isDropdownOpen && !readOnly && (
            <div
              className={`absolute top-full left-0 mt-1 w-full min-w-[280px] border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
              }`}
            >
              {horasExtraOpciones.map(opcion => (
                <button
                  key={opcion}
                  type='button'
                  onClick={() => {
                    if (readOnly) return;
                    setHorasExtraTipo(opcion);
                    setIsDropdownOpen(false);
                    setHoveredOption(null);
                  }}
                  disabled={readOnly}
                  onMouseEnter={() => setHoveredOption(opcion)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    theme === 'light' ? 'text-gray-900' : 'text-zinc-300'
                  }`}
                  style={{
                    backgroundColor: hoveredOption === opcion ? (theme === 'light' ? '#A0D3F2' : focusColor) : 'transparent',
                    color: hoveredOption === opcion ? (theme === 'light' ? '#111827' : 'white') : 'inherit',
                  }}
                >
                  {opcion}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('reports.from')}</label>
          <input
            type='date'
            value={dateFrom}
            onChange={e => !readOnly && setDateFrom(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.from')}
          />
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-zinc-300 whitespace-nowrap'>{t('reports.to')}</label>
          <input
            type='date'
            value={dateTo}
            onChange={e => !readOnly && setDateTo(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            className={`px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.to')}
          />
        </div>
        <button
          onClick={handleExportPDF}
          className='px-3 py-2 rounded-lg text-sm font-semibold btn-pdf'
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          title={t('reports.exportMonthPDF')}
        >
          PDF
        </button>
      </div>
    </div>
  );
}

