import React from 'react';
import { useTranslation } from 'react-i18next';
import ReportesSemana from '../ReportesSemana.tsx';
import { AnyRecord } from '@shared/types/common';
import { translateWeekLabel, weekToSemanasISO, weekToPersonas } from './ReportesTabHelpers';
import { MonthReportGroupProps } from './MonthReportGroup/MonthReportGroupTypes';
import { useDateRange } from './MonthReportGroup/useDateRange';
import { useHorasExtraSelector } from './MonthReportGroup/useHorasExtraSelector';
import { useExportPDF } from './MonthReportGroup/useExportPDF';
import { MonthReportGroupHeader } from './MonthReportGroup/MonthReportGroupHeader';

function MonthReportGroup({
  monthKey,
  monthName,
  monthNameFull,
  weeks,
  allWeeksAvailable,
  project,
  mode,
  weekToSemanasISO,
  weekToPersonas,
  allMonthKeys,
  readOnly = false,
}: MonthReportGroupProps) {
  const { t } = useTranslation();

  // Gestión de rango de fechas
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRange({
    weeks,
    weekToSemanasISO,
    project,
    mode,
    monthKey,
    allMonthKeys,
  });

  // Selector de horas extra
  const horasExtraSelector = useHorasExtraSelector({
    project,
    mode,
    monthKey,
    readOnly,
  });

  // Exportación a PDF
  const { handleExportPDF } = useExportPDF({
    project,
    dateFrom,
    dateTo,
    allWeeksAvailable,
    weekToSemanasISO,
    weekToPersonas,
    mode,
  });

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4'>
      {/* Bloque de controles del mes */}
      <MonthReportGroupHeader
        monthName={monthName}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        readOnly={readOnly}
        handleExportPDF={handleExportPDF}
        horasExtraOpciones={horasExtraSelector.horasExtraOpciones}
        displayedHorasExtraTipo={horasExtraSelector.displayedHorasExtraTipo}
        setHorasExtraTipo={horasExtraSelector.setHorasExtraTipo}
        theme={horasExtraSelector.theme}
        focusColor={horasExtraSelector.focusColor}
        isDropdownOpen={horasExtraSelector.isDropdownOpen}
        setIsDropdownOpen={horasExtraSelector.setIsDropdownOpen}
        hoveredOption={horasExtraSelector.hoveredOption}
        setHoveredOption={horasExtraSelector.setHoveredOption}
        isButtonHovered={horasExtraSelector.isButtonHovered}
        setIsButtonHovered={horasExtraSelector.setIsButtonHovered}
        dropdownRef={horasExtraSelector.dropdownRef}
      />

      {/* Semanas del mes */}
      {weeks.map(week => (
        <ReportesSemana
          key={week.id as string}
          project={project as AnyRecord}
          title={translateWeekLabel(week.label as string, t)}
          semana={weekToSemanasISO(week)}
          personas={weekToPersonas(week)}
          mode={mode}
          horasExtraTipo={horasExtraSelector.displayedHorasExtraTipo}
          readOnly={readOnly}
          planTimesByDate={(iso: string) => {
            const idx = weekToSemanasISO(week).indexOf(iso);
            if (idx >= 0) {
              const d = (week.days as AnyRecord[])[idx];
              return { inicio: d.start || '', fin: d.end || '' };
            }
            return null;
          }}
        />
      ))}
    </div>
  );
}

export default MonthReportGroup;
