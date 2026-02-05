import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import i18n from '../../../../i18n/config';
import { WeekEntry } from './types';
import { AnyRecord } from '@shared/types/common';
import { buildNecesidadesHTMLForPDF } from './htmlBuilders';
import { getNeedsLabel, getCompleteLabel } from './helpers';
import { storage } from '@shared/services/localStorage.service';
import { shareOrSavePDF } from '@shared/utils/pdfShare';

/**
 * Export all weeks to PDF
 */
export async function exportAllToPDF(
  project: any,
  weekEntries: WeekEntry[],
  planFileName?: string
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Process each week as a separate page
    let shootingDayOffset = 0;
    for (let i = 0; i < weekEntries.length; i++) {
      const wk = weekEntries[i];
      const wid = wk.id;
      
      // Obtener las filas seleccionadas para esta semana desde localStorage
      const selectedRowsKey = `needs_${wid}_selectedRows`;
      const selectedRowKeys: string[] = storage.getJSON<string[]>(selectedRowsKey) || [];
      
      // Mapeo de claves de fila a fieldKey/listKey
      const rowKeyToFieldKey: Record<string, string> = {
        [`${wid}_loc`]: 'loc',
        [`${wid}_seq`]: 'seq',
        [`${wid}_shootDay`]: 'shootDay',
        [`${wid}_crewList`]: 'crewList',
        [`${wid}_refList`]: 'refList',
        [`${wid}_needTransport`]: 'needTransport',
        [`${wid}_transportExtra`]: 'transportExtra',
        [`${wid}_needGroups`]: 'needGroups',
        [`${wid}_needCranes`]: 'needCranes',
        [`${wid}_needLight`]: 'needLight',
        [`${wid}_extraMat`]: 'extraMat',
        [`${wid}_precall`]: 'precall',
        [`${wid}_preList`]: 'preList',
        [`${wid}_pickList`]: 'pickList',
        [`${wid}_obs`]: 'obs',
      };
      const customRows = Array.isArray(wk?.customRows) ? wk.customRows : [];
      customRows.forEach((row: any) => {
        if (row?.id && row?.fieldKey) {
          rowKeyToFieldKey[`${wid}_custom_${row.id}`] = row.fieldKey;
        }
      });
      
      // Obtener datos de la semana
      let valuesByDay = Array.from({ length: 7 }).map(
        (_, i) => (wk as AnyRecord)?.days?.[i] || {}
      );
      
      // Si hay filas seleccionadas, filtrar los datos
      if (selectedRowKeys && selectedRowKeys.length > 0) {
        // Obtener los fieldKeys/listKeys seleccionados
        const selectedFields = selectedRowKeys
          .map(key => rowKeyToFieldKey[key])
          .filter(Boolean);
        const needsTipo = selectedFields.includes('shootDay');
        
        // Filtrar los datos para incluir solo las filas seleccionadas
        valuesByDay = valuesByDay.map(day => {
          const filteredDay: Record<string, any> = {};
          
          // Incluir solo los campos seleccionados
          selectedFields.forEach(fieldKey => {
            if (fieldKey === 'crewList') {
              filteredDay.crewList = day.crewList;
              filteredDay.crewTxt = day.crewTxt;
              filteredDay.crewTipo = day.crewTipo ?? day.tipo;
              filteredDay.crewStart = day.crewStart ?? day.start;
              filteredDay.crewEnd = day.crewEnd ?? day.end;
            } else if (fieldKey === 'preList') {
              filteredDay.preList = day.preList;
              filteredDay.preNote = day.preNote ?? day.preTxt;
              filteredDay.prelightTipo = day.prelightTipo ?? day.preTipo;
              filteredDay.preStart = day.preStart ?? day.prelightStart;
              filteredDay.preEnd = day.preEnd ?? day.prelightEnd;
            } else if (fieldKey === 'pickList') {
              filteredDay.pickList = day.pickList;
              filteredDay.pickNote = day.pickNote ?? day.pickTxt;
              filteredDay.pickupTipo = day.pickupTipo ?? day.pickTipo;
              filteredDay.pickStart = day.pickStart ?? day.pickupStart;
              filteredDay.pickEnd = day.pickEnd ?? day.pickupEnd;
            } else if (fieldKey === 'refList') {
              filteredDay.refList = day.refList;
              filteredDay.refTxt = day.refTxt;
              filteredDay.refTipo = day.refTipo;
              filteredDay.refStart = day.refStart;
              filteredDay.refEnd = day.refEnd;
            } else {
              filteredDay[fieldKey] = day[fieldKey];
            }
          });
          if (needsTipo) {
            filteredDay.crewTipo = day.crewTipo ?? day.tipo;
          }
          
          return filteredDay;
        });
      }

      // Create HTML for this week only
      const weekHTML = buildNecesidadesHTMLForPDF(
        project,
        wk.label || i18n.t('needs.week'),
        wk.startDate || '',
        valuesByDay,
        selectedRowKeys.length > 0 ? selectedRowKeys : undefined, // Pasar las filas seleccionadas
        undefined,
        false,
        customRows,
        shootingDayOffset,
        planFileName
      );
      
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = weekHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '1123px'; // A4 landscape width at 96 DPI
      tempContainer.style.height = '794px'; // A4 landscape height at 96 DPI
      document.body.appendChild(tempContainer);

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 3, // Higher quality for readability
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123, // 297mm at 96 DPI
        height: 794, // 210mm at 96 DPI - fixed height for consistent pages
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1123,
        windowHeight: 794, // Fixed height for consistent pages
        ignoreElements: () => {
          // Don't ignore footer elements
          return false;
        },
        onclone: (clonedDoc) => {
          // Ensure footer visibility in cloned document
          const footer = clonedDoc.querySelector('.footer') as HTMLElement;
          if (footer) {
            footer.style.position = 'relative';
            footer.style.display = 'flex';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            console.log(`🔧 Necesidades PDF All - Page ${i + 1}: Footer styles applied in cloned document`);
          } else {
            console.log(`❌ Necesidades PDF All - Page ${i + 1}: Footer not found in cloned document`);
          }
        }
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');

      const weekDays = (wk as AnyRecord)?.days || [];
      for (let d = 0; d < 7; d++) {
        const day: AnyRecord = (weekDays as AnyRecord[])[d] || {};
        const jornadaRaw = day?.crewTipo ?? day?.tipo ?? '';
        const jornada = String(jornadaRaw).trim().toLowerCase();
        if (jornada === 'rodaje' || jornada === 'rodaje festivo') {
          shootingDayOffset += 1;
        }
      }
      
      // Add page to PDF (except for the first page which is already created)
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      
      console.log(`📄 Necesidades PDF All: Page ${i + 1}/${weekEntries.length} generated`);
    }
    
    // Generate filename
    const projectName = project?.nombre || i18n.t('needs.project');
    const needsLabel = getNeedsLabel();
    const completeLabel = getCompleteLabel();
    const filename = `${needsLabel}_${completeLabel}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    await shareOrSavePDF(pdf, filename, needsLabel);
    console.log(`✅ Necesidades PDF All: ${weekEntries.length} pages saved as ${filename}`);
  } catch (error) {
    console.error('Error generating PDF for all needs:', error);
    throw error;
  }
}
