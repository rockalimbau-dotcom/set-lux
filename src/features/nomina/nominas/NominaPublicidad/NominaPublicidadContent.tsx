import React from 'react';
import MonthSection from '../../components/MonthSection.jsx';
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import {
  makeRolePrices as makeRolePricesPublicidad,
  aggregateReports as aggregateReportsPublicidad,
  aggregateWindowedReport as aggregateWindowedReportPublicidad,
  getOvertimeWindowForPayrollMonth as getOvertimeWindowForPayrollMonthPublicidad,
  isoInRange as isoInRangePublicidad,
} from '../../utils/calcPublicidad';
import { monthLabelEs } from '@shared/utils/date';
import { calcWorkedBreakdown } from '@shared/utils/calcWorkedBreakdown';
import { buildNominaMonthHTML, openPrintWindow, exportToPDF } from '../../utils/export';
import { stripPR, buildRefuerzoIndex } from '../../utils/plan';
import { ProjectLike } from './NominaPublicidadTypes';
import { useMonthGrouping } from './useMonthGrouping';

interface NominaPublicidadContentProps {
  project: ProjectLike;
  projectWithMode: any;
  allWeeks: any[];
  rolePrices: any;
  basePersist: string;
  readOnly: boolean;
}

export function NominaPublicidadContent({
  project,
  projectWithMode,
  allWeeks,
  rolePrices,
  basePersist,
  readOnly,
}: NominaPublicidadContentProps) {
  const { monthMap, monthKeys } = useMonthGrouping(allWeeks);

  // Export por mes usando las filas enriquecidas que nos pasa MonthSection
  const exportMonth = (monthKey: string, enrichedRows: any[]) => {
    const html = buildNominaMonthHTML(project, monthKey, enrichedRows, monthLabelEs);
    openPrintWindow(html);
  };

  // Export to PDF
  const exportMonthPDF = async (monthKey: string, enrichedRows: any[]) => {
    const success = await exportToPDF({
      project,
      monthKey,
      enrichedRows,
      monthLabelEs,
    });
    if (!success) {
      // Fallback to HTML if PDF fails
      exportMonth(monthKey, enrichedRows);
    }
  };

  // ===== Días trabajados / Travel Day =====
  // Wrapper para mantener la misma firma pero usar la función compartida
  function calcWorkedBreakdownLocal(
    weeks: any[],
    filterISO: (iso: string) => boolean,
    person: { role: string; name: string }
  ) {
    return calcWorkedBreakdown(weeks, filterISO, person, 'publicidad');
  }

  return (
    <div className='space-y-6'>
      {monthKeys.map((mk, i) => {
        const bucket = monthMap.get(mk)!;
        const weeks = bucket ? Array.from(bucket.weeks) : [];
        const isos = bucket ? Array.from(bucket.isos) : [];
        const isoSet = new Set(isos);
        const filterISO = (iso: string) => isoSet.has(iso);

        // Ventana contable (si está configurada en Condiciones)
        const win = getOvertimeWindowForPayrollMonthPublicidad(projectWithMode, mk);

        // Si hay ventana contable, agregamos variables en esa ventana:
        let windowOverrideMap: Map<string, any> | null = null;
        if (win) {
          const filterWindowISO = (iso: string) => isoInRangePublicidad(iso, win.start, win.end);
          windowOverrideMap = aggregateWindowedReportPublicidad(
            projectWithMode,
            weeks,
            filterWindowISO
          ) as Map<string, any>;
        }

        const baseRows = aggregateReportsPublicidad(projectWithMode, weeks, filterISO);

        return (
          <MonthSection
            key={mk}
            monthKey={mk}
            rows={baseRows as any}
            weeksForMonth={weeks}
            filterISO={filterISO}
            rolePrices={rolePrices}
            projectMode='publicidad'
            defaultOpen={i === 0}
            persistKeyBase={basePersist}
            onExport={exportMonth}
            onExportPDF={exportMonthPDF}
            windowOverrideMap={windowOverrideMap}
            buildRefuerzoIndex={buildRefuerzoIndex}
            stripPR={stripPR}
            calcWorkedBreakdown={calcWorkedBreakdownLocal}
            monthLabelEs={monthLabelEs}
            ROLE_COLORS={ROLE_COLORS as any}
            roleLabelFromCode={roleLabelFromCode}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

