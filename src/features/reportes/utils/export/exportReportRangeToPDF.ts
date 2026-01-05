import { translateJornadaType as translateJornadaTypeUtil } from '@shared/utils/jornadaTranslations';
import { ExportReportRangeParams } from './types';
import { buildReportWeekHTMLForPDF } from './buildReportWeekHTMLForPDF';
import { calculatePersonsPerPage } from './paginationHelpers';
import { generateRangeFilename, getFilenameTranslation } from './filenameHelpers';
import { rolePriorityForReports, sortPersonKeysByRole } from './dataHelpers';

/**
 * Helper function to check if a date is Saturday (6) or Sunday (0)
 */
const isWeekend = (iso: string): boolean => {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  } catch {
    return false;
  }
};

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
    const { storage } = await import('@shared/services/localStorage.service');
    const { toDisplayDate, dayNameFromISO, mondayOf, toISO } = await import('@shared/utils/date');
    const { findWeekAndDayFactory } = await import('../plan');
    const { personaKey } = await import('../model');
    const { DAY_NAMES, CONCEPTS } = await import('../../constants');
    const { 
      horarioPrelightFactory, 
      horarioPickupFactory,
      buildSafePersonas,
      collectWeekTeamWithSuffixFactory,
      collectRefNamesForBlock,
    } = await import('../derive');
    const { getTranslation } = await import('./translationHelpers');

    const planKey = `plan_${project?.id || project?.nombre || 'demo'}`;
    const getPlanAllWeeks = () => {
      try {
        const obj = storage.getJSON<any>(planKey);
        if (!obj) return { pre: [], pro: [] };
        return obj || { pre: [], pro: [] };
      } catch {
        return { pre: [], pro: [] };
      }
    };

    const findWeekAndDay = findWeekAndDayFactory(getPlanAllWeeks, mondayOf, toISO);

    // Helper to translate jornada type
    const translateJornadaType = (tipo: string): string => {
      return translateJornadaTypeUtil(tipo, (key: string, defaultValue?: string) => getTranslation(key, defaultValue || key));
    };

    const horarioTexto = (iso: string) => {
      const { day } = findWeekAndDay(iso);
      const addInPlanning = getTranslation('reports.addInPlanning', 'Añadelo en Planificación');
      if (!day) return addInPlanning;
      if ((day.tipo || '') === 'Descanso') return getTranslation('planning.rest', 'DESCANSO');
      const etiqueta = day.tipo && day.tipo !== 'Rodaje' && day.tipo !== 'Oficina' && day.tipo !== 'Rodaje Festivo' ? `${translateJornadaType(day.tipo)}: ` : '';
      if (!day.start || !day.end) return `${etiqueta}${addInPlanning}`;
      return `${etiqueta}${day.start}–${day.end}`;
    };

    const horarioPrelightFn = horarioPrelight || horarioPrelightFactory(findWeekAndDay);
    const horarioPickupFn = horarioPickup || horarioPickupFactory(findWeekAndDay);

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
      
      // Filter only days from this week that are in the range
      const weekDaysInRange = weekDays.filter(day => safeSemana.includes(day));
      
      if (weekDaysInRange.length === 0) continue;

      // Filter days that are not DESCANSO or have data
      const restLabel = getTranslation('planning.rest', 'DESCANSO');
      const filteredWeekDays = weekDaysInRange.filter(iso => {
        const dayLabel = horarioTexto(iso);
        // If it's DESCANSO and it's Saturday or Sunday
        if (dayLabel === restLabel && isWeekend(iso)) {
          // Check if it has prelight or pickup
          const hasPrelight = horarioPrelightFn(iso) !== '—';
          const hasPickup = horarioPickupFn(iso) !== '—';
          // If it doesn't have prelight or pickup, exclude it
          if (!hasPrelight && !hasPickup) {
            return false;
          }
        }
        return true; // Include all other days
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

      // Get data for this week
      const weekKey = `reportes_${baseId}_${weekDays.join('_')}`;
      let weekData: any = {};
      try {
        weekData = storage.getJSON<any>(weekKey) || {};
      } catch (e) {
        console.error('Error loading week data:', e);
      }

      // Ensure all personas have data structure
      safePersonas.forEach(p => {
        const key = personaKey(p);
        if (!weekData[key]) {
          weekData[key] = {};
        }
        CONCEPTS.forEach(concepto => {
          if (!weekData[key][concepto]) {
            weekData[key][concepto] = {};
          }
          filteredWeekDays.forEach(day => {
            if (weekData[key][concepto][day] === undefined) {
              weekData[key][concepto][day] = '';
            }
          });
        });
      });

      // Helper to translate week label
      const translateWeekLabel = (label: string): string => {
        if (!label) return getTranslation('reports.week', 'Semana');
        const match = label.match(/^(Semana|Week|Setmana)\s*(-?\d+)$/i);
        if (match) {
          const number = match[2];
          if (number.startsWith('-')) {
            return getTranslation('planning.weekFormatNegative', `Semana -${number.substring(1)}`).replace('{{number}}', number.substring(1));
          } else {
            return getTranslation('planning.weekFormat', `Semana ${number}`).replace('{{number}}', number);
          }
        }
        return label;
      };

      // Title for this week
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

        // Convert HTML to image and add to PDF
        const html2canvas = (await import('html2canvas')).default;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '1123px';
        tempContainer.style.height = 'auto';
        tempContainer.style.minHeight = '794px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.overflow = 'visible';

        document.body.appendChild(tempContainer);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Debug: Check if footer exists and is visible
        const footer = tempContainer.querySelector('.footer') as HTMLElement;
        if (footer) {
          console.log(`📄 Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer found, height: ${footer.offsetHeight}px, visible: ${footer.offsetHeight > 0}`);
        } else {
          console.log(`❌ Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer NOT found!`);
        }

        const canvas = await html2canvas(tempContainer, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1123,
          height: tempContainer.scrollHeight + 100,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1123,
          windowHeight: tempContainer.scrollHeight + 100,
          ignoreElements: () => false,
          onclone: (clonedDoc) => {
            const footer = clonedDoc.querySelector('.footer') as HTMLElement;
            if (footer) {
              footer.style.position = 'relative';
              footer.style.display = 'flex';
              footer.style.visibility = 'visible';
              footer.style.opacity = '1';
              console.log(`🔧 Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer styles applied in cloned document`);
            } else {
              console.log(`❌ Week ${weekIndex + 1}, Page ${pageIndex + 1}: Footer not found in cloned document`);
            }
          }
        });

        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height / canvas.width) * 297;
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

