import { ExportReportRangeParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';
import { calculatePersonsPerPage } from './paginationHelpers';
import { generateRangeFilename } from './filenameHelpers';
import { sortPersonKeysByRole } from './dataHelpers';
import { isWeekend } from './dateHelpers';
import { filterWeekDaysForExport, translateWeekLabel } from './weekProcessingHelpers';
import { prepareWeekData } from './weekDataHelpers';
import { generatePDFPageFromHTML } from './pdfGenerationHelpers';
import { initializeExportHelpers } from './exportInitializationHelpers';

export async function exportReportRangeToPDF(params: ExportReportRangeParams) {
  const {
    project,
    title,
    safeSemana,
    personas,
    mode,
    weekToSemanasISO,
    weekToPersonas,
    weeks,
    horarioPrelight,
    horarioPickup,
  } = params;

  try {
    const { toDisplayDate, dayNameFromISO, mondayOf, toISO } = await import('@shared/utils/date');
    const { findWeekAndDayFactory } = await import('../plan');
    const { DAY_NAMES, CONCEPTS } = await import('../../constants');
    const { 
      buildSafePersonas,
      collectWeekTeamWithSuffixFactory,
      collectRefNamesForBlock,
    } = await import('../derive');

    // Initialize helper functions
    const getPlanAllWeeks = () => {
      const { storage } = require('@shared/services/localStorage.service');
      const planKey = `plan_${project?.id || project?.nombre || 'demo'}`;
      try {
        const obj = storage.getJSON<any>(planKey);
        if (!obj) return { pre: [], pro: [] };
        return obj || { pre: [], pro: [] };
      } catch {
        return { pre: [], pro: [] };
      }
    };

    const findWeekAndDay = findWeekAndDayFactory(getPlanAllWeeks, mondayOf, toISO);

    const {
      horarioTexto,
      horarioPrelightFn,
      horarioPickupFn,
    } = await initializeExportHelpers({
      project,
      findWeekAndDay,
      horarioPrelight,
      horarioPickup,
    });

    // Sort weeks by start date
    const sortedWeeks = [...weeks].sort((a, b) => {
      const weekA = weekToSemanasISO(a);
      const weekB = weekToSemanasISO(b);
      return weekA[0].localeCompare(weekB[0]);
    });

    // Create PDF for all weeks
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const baseId = project?.id || project?.nombre || 'tmp';

    // Export each week separately
    for (let weekIndex = 0; weekIndex < sortedWeeks.length; weekIndex++) {
      const week = sortedWeeks[weekIndex];
      const weekDays = weekToSemanasISO(week);
      
      const filteredWeekDays = filterWeekDaysForExport({
        weekDays,
        safeSemana,
        horarioTexto,
        horarioPrelightFn,
        horarioPickupFn,
        isWeekend,
      });

      if (filteredWeekDays.length === 0) continue;

      // Build personas for this week
      const weekPersonas = weekToPersonas(week);
      const providedPersonas = weekPersonas || [];
      
      // Detect prelight and pickup active in this week
      const weekPrelightActive = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.prelight || []).length > 0 ||
            day.prelightStart ||
            day.prelightEnd)
        );
      });

      const weekPickupActive = filteredWeekDays.some(iso => {
        const { day } = findWeekAndDay(iso);
        return !!(
          day &&
          day.tipo !== 'Descanso' &&
          ((day.pickup || []).length > 0 || day.pickupStart || day.pickupEnd)
        );
      });

      const collectWeekTeamWithSuffix = collectWeekTeamWithSuffixFactory(
        findWeekAndDay,
        [...filteredWeekDays]
      );

      const prelightPeople = weekPrelightActive ? collectWeekTeamWithSuffix('prelight', 'P') : [];
      const pickupPeople = weekPickupActive ? collectWeekTeamWithSuffix('pickup', 'R') : [];

      const refNamesBase = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'team');
      const refNamesPre = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'prelight');
      const refNamesPick = collectRefNamesForBlock(filteredWeekDays, findWeekAndDay, 'pickup');

      const safePersonas = buildSafePersonas(
        providedPersonas,
        weekPrelightActive,
        prelightPeople,
        weekPickupActive,
        pickupPeople
      );

      const weekData = prepareWeekData({
        project,
        weekDays: filteredWeekDays,
        safePersonas,
      });

      const weekLabel = week.label as string || `Semana ${weekIndex + 1}`;
      const weekTitle = translateWeekLabel(weekLabel);

      // Sort person keys by role hierarchy
      const personKeys = sortPersonKeysByRole(Object.keys(weekData || {}));

      // Calculate pagination per person
      const totalPersons = personKeys.length;
      const { personsPerPage, totalPages: totalPagesForWeek } = calculatePersonsPerPage(totalPersons, CONCEPTS);

      // Generate pages for this week
      for (let pageIndex = 0; pageIndex < totalPagesForWeek; pageIndex++) {
        // If not the first page of the first week, add new page
        if (weekIndex > 0 || pageIndex > 0) {
          pdf.addPage();
        }

        const startPerson = pageIndex * personsPerPage;
        const endPerson = Math.min(startPerson + personsPerPage, totalPersons);
        const pagePersonKeys = personKeys.slice(startPerson, endPerson);
        
        const pageData: any = {};
        pagePersonKeys.forEach(pk => {
          pageData[pk] = weekData[pk];
        });

        // Generate HTML for this page
        const html = buildReportWeekHTMLForPDF({
          project,
          title: weekTitle,
          safeSemana: filteredWeekDays,
          dayNameFromISO: (iso: string, index: number) => dayNameFromISO(iso, index, [...DAY_NAMES] as any),
          toDisplayDate,
          horarioTexto,
          CONCEPTS: [...CONCEPTS],
          data: pageData,
        });

        const { imgData, imgHeight } = await generatePDFPageFromHTML({
          html,
          weekIndex,
          pageIndex,
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 297, imgHeight);
      }
    }

    // Save final PDF
    const fname = generateRangeFilename(project, title, safeSemana);
    pdf.save(fname);

    return true;
  } catch (error) {
    console.error('Error generating Report Range PDF:', error);
    return false;
  }
}

