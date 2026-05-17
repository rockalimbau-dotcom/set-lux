import jsPDF from 'jspdf';
import i18n from '../../../../i18n/config';
import { CustomRow, DayValues, RowLabelOverrides } from './types';
import { buildNecesidadesHTMLForPDF } from './htmlBuilders';
import { translateWeekLabel, getNeedsLabel } from './helpers';
import { shareOrSavePDF } from '@shared/utils/pdfShare';
import { addLandscapeCanvasToPdf, captureLandscapeHtml } from '@shared/lib/pdf/landscapeCapture';

/**
 * Export single week to PDF
 */
export async function exportToPDF(
  project: any,
  weekLabel: string,
  weekStart: string,
  valuesByDay: DayValues[],
  selectedRowKeys?: string[], // Filas seleccionadas para filtrar qué mostrar
  selectedDayIdxs?: number[], // Columnas seleccionadas (días)
  includeEmptyRows?: boolean, // Incluir filas vacías
  customRows?: CustomRow[],
  rowLabels?: RowLabelOverrides,
  shootingDayOffset: number = 0,
  planFileName?: string
): Promise<void> {
  try {
    const html = buildNecesidadesHTMLForPDF(
      project,
      weekLabel,
      weekStart,
      valuesByDay,
      selectedRowKeys,
      selectedDayIdxs,
      includeEmptyRows,
      customRows,
      rowLabels,
      shootingDayOffset,
      planFileName
    );

    const canvas = await captureLandscapeHtml(html);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    addLandscapeCanvasToPdf(pdf, canvas);

    const needsLabel = getNeedsLabel();
    const translatedWeekLabel = translateWeekLabel(weekLabel);
    const weekPart = translatedWeekLabel.replace(/\s+/g, '');
    const projectName = project?.nombre || i18n.t('needs.project');
    const filename = `${needsLabel}_${weekPart}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    await shareOrSavePDF(pdf, filename, needsLabel);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
