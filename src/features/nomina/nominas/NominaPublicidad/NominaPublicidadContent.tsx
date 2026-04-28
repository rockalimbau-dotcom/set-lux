import React from 'react';
import MonthSection from '../../components/MonthSection.jsx';
import { ROLE_COLORS, roleLabelFromCode } from '@shared/constants/roles';
import {
  makeRolePrices as makeRolePricesDiario,
  aggregateReports as aggregateReportsDiario,
  aggregateWindowedReport as aggregateWindowedReportDiario,
  getOvertimeWindowForPayrollMonth as getOvertimeWindowForPayrollMonthDiario,
  isoInRange as isoInRangeDiario,
} from '../../utils/calcPublicidad';
import { monthLabelEs } from '@shared/utils/date';
import { calcWorkedBreakdown } from '@shared/utils/calcWorkedBreakdown';
import { buildNominaMonthHTML, openPrintWindow, exportToPDF } from '../../utils/export';
import { stripPR, buildRefuerzoIndex } from '../../utils/plan';
import { ProjectLike } from './NominaPublicidadTypes';
import { useMonthGrouping } from './useMonthGrouping';
import { STORAGE_CHANGE_EVENT } from '@shared/services/localStorage.service';

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
  const [reportsVersion, setReportsVersion] = React.useState(0);
  const reportsKeyPrefix = `reportes_${projectWithMode?.id || projectWithMode?.nombre || 'tmp'}_`;

  React.useEffect(() => {
    const bumpIfReportsKey = (key?: string | null) => {
      if (!key || typeof key !== 'string') return;
      if (!key.startsWith(reportsKeyPrefix)) return;
      setReportsVersion(v => v + 1);
    };

    const onStorage = (e: StorageEvent) => bumpIfReportsKey(e.key);
    const onLocalStorageChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      bumpIfReportsKey(detail?.key || null);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGE_EVENT, onLocalStorageChange as EventListener);
    };
  }, [reportsKeyPrefix]);

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
    return calcWorkedBreakdown(weeks, filterISO, person, 'diario');
  }

  return (
    <div className='space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6'>
      {monthKeys.map((mk, i) => {
        const bucket = monthMap.get(mk)!;
        const weeks = bucket ? Array.from(bucket.weeks) : [];
        const isos = bucket ? Array.from(bucket.isos) : [];
        const isoSet = new Set(isos);
        const filterISO = (iso: string) => isoSet.has(iso);

        // Ventana contable (si está configurada en Condiciones)
        const win = getOvertimeWindowForPayrollMonthDiario(projectWithMode, mk);

        // Si hay ventana contable, agregamos variables en esa ventana:
        let windowOverrideMap: Map<string, any> | null = null;
        if (win) {
          const filterWindowISO = (iso: string) => isoInRangeDiario(iso, win.start, win.end);
          windowOverrideMap = aggregateWindowedReportDiario(
            projectWithMode,
            weeks,
            filterWindowISO
          ) as Map<string, any>;
        }

        const baseRows = aggregateReportsDiario(projectWithMode, weeks, filterISO);

        return (
          <MonthSection
            key={`${mk}-${reportsVersion}`}
            monthKey={mk}
            rows={baseRows as any}
            weeksForMonth={weeks}
            filterISO={filterISO}
            rolePrices={rolePrices}
            projectMode='diario'
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
            isFirstProjectMonth={mk === monthKeys[0]}
          />
        );
      })}
    </div>
  );
}
