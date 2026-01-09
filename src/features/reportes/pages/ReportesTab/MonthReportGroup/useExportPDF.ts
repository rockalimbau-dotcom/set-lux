import { useTranslation } from 'react-i18next';
import { exportReportRangeToPDF } from '../../../utils/export';
import { AnyRecord } from '@shared/types/common';
import { formatDateForTitle, weekToSemanasISO, weekToPersonas } from '../ReportesTabHelpers';

interface UseExportPDFParams {
  project?: { id?: string; nombre?: string };
  dateFrom: string;
  dateTo: string;
  allWeeksAvailable: AnyRecord[];
  weekToSemanasISO: (week: AnyRecord) => string[];
  weekToPersonas: (week: AnyRecord) => AnyRecord[];
  mode: 'semanal' | 'mensual' | 'diario';
}

/**
 * Hook para gestionar la exportación a PDF
 */
export function useExportPDF({
  project,
  dateFrom,
  dateTo,
  allWeeksAvailable,
  weekToSemanasISO,
  weekToPersonas,
  mode,
}: UseExportPDFParams) {
  const { t } = useTranslation();

  const handleExportPDF = async () => {
    if (!dateFrom || !dateTo) {
      alert(t('reports.pleaseSelectDates'));
      return;
    }

    // Buscar TODAS las semanas que tengan días en el rango, no solo las del mes agrupado
    const weeksInRange: AnyRecord[] = [];
    allWeeksAvailable.forEach(week => {
      const weekDays = weekToSemanasISO(week);
      const hasDaysInRange = weekDays.some(day => day >= dateFrom && day <= dateTo);
      if (hasDaysInRange) {
        weeksInRange.push(week);
      }
    });

    if (weeksInRange.length === 0) {
      alert(t('reports.noWeeksInRange'));
      return;
    }

    // Recopilar todos los días del rango de todas las semanas encontradas
    const allDaysInRange: string[] = [];
    weeksInRange.forEach(week => {
      const weekDays = weekToSemanasISO(week);
      weekDays.forEach(day => {
        if (day >= dateFrom && day <= dateTo) {
          if (!allDaysInRange.includes(day)) {
            allDaysInRange.push(day);
          }
        }
      });
    });
    allDaysInRange.sort();

    if (allDaysInRange.length === 0) {
      alert(t('reports.noDaysInRange'));
      return;
    }

    // Recopilar todas las personas de todas las semanas encontradas
    const allPersonas = new Map<string, AnyRecord>();
    weeksInRange.forEach(week => {
      weekToPersonas(week).forEach(persona => {
        const key = `${persona.cargo}__${persona.nombre}`;
        if (!allPersonas.has(key)) {
          allPersonas.set(key, persona);
        }
      });
    });

    // Exportar PDF con el rango de fechas usando todas las semanas encontradas
    await exportReportRangeToPDF({
      project,
      title: t('reports.fromDateToDate', { from: formatDateForTitle(dateFrom), to: formatDateForTitle(dateTo) }),
      safeSemana: allDaysInRange,
      personas: Array.from(allPersonas.values()),
      mode,
      weekToSemanasISO,
      weekToPersonas,
      weeks: weeksInRange,
    });
  };

  return { handleExportPDF };
}

