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
    <div className='month-report-header-container flex flex-col lg:flex-row items-start lg:items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 bg-neutral-panel/50 rounded sm:rounded-md md:rounded-lg border border-neutral-border'>
      {/* Primera fila: Mes y Horas Extra */}
      <div className='flex items-center gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto'>
        <span className='text-xs sm:text-sm md:text-base font-semibold text-brand'>{monthName}</span>
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2 relative' ref={dropdownRef}>
          <button
            type='button'
            onClick={() => !readOnly && setIsDropdownOpen(!isDropdownOpen)}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onBlur={() => setIsButtonHovered(false)}
            className={`px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg border focus:outline-none text-[9px] sm:text-[10px] md:text-xs lg:text-sm w-full sm:w-auto min-w-[120px] sm:min-w-[180px] md:min-w-[240px] lg:min-w-[280px] text-left transition-colors ${
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M5 7.5L1 3.5h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '1.75rem',
            }}
          >
            {displayedHorasExtraTipo}
          </button>
          {isDropdownOpen && !readOnly && (
            <div
              className={`absolute top-full left-0 mt-1 w-full min-w-[120px] sm:min-w-[180px] md:min-w-[240px] lg:min-w-[280px] border border-neutral-border rounded sm:rounded-md md:rounded-lg shadow-lg z-50 overflow-y-auto max-h-40 sm:max-h-48 md:max-h-60 ${
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
                  className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm transition-colors ${
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
      </div>

      {/* Segunda fila (solo en móvil): Fechas y PDF */}
      <div className='flex items-center gap-2 sm:gap-2 md:gap-4 w-full lg:w-auto lg:ml-auto'>
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <label className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-300 whitespace-nowrap'>{t('reports.from')}</label>
          <input
            type='date'
            value={dateFrom}
            onChange={e => !readOnly && setDateFrom(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            className={`w-[80px] sm:w-[104px] md:w-[120px] lg:w-[136px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.from')}
          />
        </div>
        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2'>
          <label className='text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-zinc-300 whitespace-nowrap'>{t('reports.to')}</label>
          <input
            type='date'
            value={dateTo}
            onChange={e => !readOnly && setDateTo(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            className={`w-[80px] sm:w-[104px] md:w-[120px] lg:w-[136px] px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-left ${
              readOnly ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={readOnly ? t('conditions.projectClosed') : t('reports.to')}
          />
        </div>
        <button
          onClick={handleExportPDF}
          className='ml-auto lg:ml-0 px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-2.5 md:py-2 rounded sm:rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold btn-pdf'
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          title={t('reports.exportMonthPDF')}
        >
          PDF
        </button>
      </div>
    </div>
  );
}

