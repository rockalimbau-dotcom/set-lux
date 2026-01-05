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
import { storage } from '@shared/services/localStorage.service';
import { personaKey } from '../model';

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
      // Usar todas las personas del rango de fechas, no solo las de esta semana
      // porque pueden tener datos en días que están en el rango pero en diferentes semanas
      const weekPersonas = weekToPersonas(week);
      // Combinar personas de la semana con todas las personas del rango para asegurar que no se pierdan datos
      const allPersonasMap = new Map<string, any>();
      // Primero agregar todas las personas del rango (ya vienen con cargo y nombre)
      personas.forEach(p => {
        const key = `${p.cargo || ''}__${p.nombre || ''}`;
        if (key !== '__') { // Solo agregar si tiene cargo o nombre
          allPersonasMap.set(key, p);
        }
      });
      // Luego agregar personas específicas de esta semana (por si hay alguna que no esté en el rango general)
      weekPersonas.forEach(p => {
        const key = `${p.cargo || ''}__${p.nombre || ''}`;
        if (key !== '__' && !allPersonasMap.has(key)) {
          allPersonasMap.set(key, p);
        }
      });
      const providedPersonas = Array.from(allPersonasMap.values());
      
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

      // Preparar datos de la semana usando los 7 días completos (no filtrados)
      // porque la clave de almacenamiento se crea con los 7 días completos
      const weekData = prepareWeekData({
        project,
        weekDays: weekDays, // Usar los 7 días completos, no filteredWeekDays
        safePersonas,
      });
      
      // Filtrar los datos para incluir solo los días que están en filteredWeekDays
      // pero mantener la estructura completa para todas las personas
      const filteredWeekData: any = {};
      safePersonas.forEach(p => {
        const key = personaKey(p);
        if (weekData[key]) {
          filteredWeekData[key] = {};
          CONCEPTS.forEach(concepto => {
            if (weekData[key][concepto]) {
              filteredWeekData[key][concepto] = {};
              // Solo incluir días que están en filteredWeekDays (días de esta semana en el rango)
              filteredWeekDays.forEach(day => {
                // Usar el valor del weekData si existe, o cadena vacía
                filteredWeekData[key][concepto][day] = weekData[key][concepto][day] !== undefined 
                  ? weekData[key][concepto][day] 
                  : '';
              });
            } else {
              // Si no hay datos para este concepto, crear estructura vacía
              filteredWeekData[key][concepto] = {};
              filteredWeekDays.forEach(day => {
                filteredWeekData[key][concepto][day] = '';
              });
            }
          });
        } else {
          // Si no hay datos para esta persona, crear estructura completa
          filteredWeekData[key] = {};
          CONCEPTS.forEach(concepto => {
            filteredWeekData[key][concepto] = {};
            filteredWeekDays.forEach(day => {
              filteredWeekData[key][concepto][day] = '';
            });
          });
        }
      });
      
      // Usar los datos filtrados para esta semana
      const finalWeekData = filteredWeekData;

      const weekLabel = week.label as string || `Semana ${weekIndex + 1}`;
      const weekTitle = translateWeekLabel(weekLabel);

      // Sort person keys by role hierarchy
      const personKeys = sortPersonKeysByRole(Object.keys(finalWeekData || {}));

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
          pageData[pk] = finalWeekData[pk] || {};
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
        
        // imgHeight ya está limitado a 210mm en generatePDFPageFromHTML
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

