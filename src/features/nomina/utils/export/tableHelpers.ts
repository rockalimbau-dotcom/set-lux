import i18n from '../../../../i18n/config';
import { applyGenderToBadge } from '@shared/constants/roles';
import { esc, displayValue, displayMoney, generateWorkedDaysText, generateExtrasText, generateDietasText, generateCargaDescargaText, getColumnVisibility } from './helpers';

/**
 * Generate header cells based on column visibility
 */
export const generateHeaderCells = (
  columnVisibility: ReturnType<typeof getColumnVisibility>,
  projectMode: 'semanal' | 'mensual' | 'diario' = 'semanal',
  options: { forPDF?: boolean } = {}
): string[] => {
  const { forPDF = false } = options;
  const useJornadasLabels = projectMode === 'semanal' || projectMode === 'diario';
  const workedLabel = useJornadasLabels ? i18n.t('payroll.workedShifts') : i18n.t('payroll.workedDays');
  const totalWorkedLabel = useJornadasLabels ? i18n.t('payroll.totalShifts') : i18n.t('payroll.totalDays');
  const localizacionLabel =
    projectMode === 'diario' ? i18n.t('payroll.localizacionTecnicaShifts') : i18n.t('payroll.localizacionTecnica');
  const totalLocalizacionLabel =
    projectMode === 'diario'
      ? i18n.t('payroll.totalLocalizacionTecnicaShifts')
      : i18n.t('payroll.totalLocalizacionTecnica');
  const workedStyle = forPDF
    ? 'text-align:center !important;vertical-align:middle !important;white-space:normal !important;'
    : `text-align:center !important;vertical-align:middle !important;white-space:nowrap !important;min-width:${useJornadasLabels ? '190px' : 'auto'};`;
  const totalWorkedStyle = forPDF
    ? 'text-align:center !important;vertical-align:middle !important;white-space:normal !important;'
    : `text-align:center !important;vertical-align:middle !important;white-space:nowrap !important;min-width:${useJornadasLabels ? '160px' : 'auto'};`;
  const localizacionStyle = forPDF
    ? 'text-align:center !important;vertical-align:middle !important;white-space:normal !important;'
    : `text-align:center !important;vertical-align:middle !important;white-space:nowrap !important;min-width:${projectMode === 'diario' ? '240px' : 'auto'};`;
  const totalLocalizacionStyle = forPDF
    ? 'text-align:center !important;vertical-align:middle !important;white-space:normal !important;'
    : `text-align:center !important;vertical-align:middle !important;white-space:nowrap !important;min-width:${projectMode === 'diario' ? '290px' : 'auto'};`;

  const headerCells = [
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.person')}</th>`,
    `<th style="${workedStyle}">${workedLabel}</th>`,
    `<th style="${totalWorkedStyle}">${totalWorkedLabel}</th>`,
  ];

  if (columnVisibility.halfDays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.halfDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalHalfDays')}</th>`);
  }

  if (columnVisibility.localizacion) {
    headerCells.push(`<th style="${localizacionStyle}">${localizacionLabel}</th>`);
    headerCells.push(`<th style="${totalLocalizacionStyle}">${totalLocalizacionLabel}</th>`);
  }

  if (columnVisibility.cargaDescarga) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.cargaDescarga')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalCargaDescarga')}</th>`);
  }

  if (columnVisibility.holidays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.holidayDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalHolidayDays')}</th>`);
  }

  if (columnVisibility.travel) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.travelDays')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTravelDays')}</th>`);
  }

  if (columnVisibility.extras) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.extraHours')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalExtraHours')}</th>`);
  }

  if (columnVisibility.materialPropio) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.ownMaterial')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalOwnMaterial')}</th>`);
  }

  if (columnVisibility.dietas) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.dietas')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDietas')}</th>`);
  }

  if (columnVisibility.transporte) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.transportes')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalTransportes')}</th>`);
  }

  if (columnVisibility.km) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.kilometraje')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalKilometraje')}</th>`);
  }

  if (columnVisibility.gasolina) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalGasoline')}</th>`);
  }

  headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalBruto')}</th>`);
  if (columnVisibility.netColumns) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.irpf')}</th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.stateTax')}</th>`);
    if (columnVisibility.extraHoursPercent) {
      headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.extraHoursPercentColumn')}</th>`);
    }
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalNet')}</th>`);
  }

  return headerCells;
};

/**
 * Generate data cells for a row
 */
export const generateRowDataCells = (
  r: any,
  columnVisibility: ReturnType<typeof getColumnVisibility>
): string[] => {
  // Usar rol original para mostrar REFG, REFBB, etc. en lugar de solo REF
  const roleForDisplay = (r as any)._originalRole || r.role || '';
  const roleDisplay = applyGenderToBadge(String(roleForDisplay), (r as any).gender);
  const dataCells = [
    `<td class="text-left" style="font-weight:600;vertical-align:middle !important;">${esc(roleDisplay)} — ${esc(r.name)}</td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;">${generateWorkedDaysText(r) || esc(displayValue(r._worked))}</td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDias, 2))}</td>`,
  ];

  if (columnVisibility.halfDays) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._halfDays))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalHalfDays, 2))}</td>`);
  }

  if (columnVisibility.localizacion) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._localizarDays))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalLocalizacion, 2))}</td>`);
  }

  if (columnVisibility.cargaDescarga) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${generateCargaDescargaText(r) || esc(displayValue((r._cargaDays || 0) + (r._descargaDays || 0)))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalCargaDescarga, 2))}</td>`);
  }

  if (columnVisibility.holidays) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._holidays))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalHolidays, 2))}</td>`);
  }

  if (columnVisibility.travel) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._travel))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTravel, 2))}</td>`);
  }

  if (columnVisibility.extras) {
    dataCells.push(`<td class="extras-cell" style="text-align:center !important;vertical-align:middle !important;">${generateExtrasText(r)}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalExtras, 2))}</td>`);
  }

  if (columnVisibility.materialPropio) {
    const materialType = r._materialPropioType === 'unico' ? 'unico' : r._materialPropioType === 'diario' ? 'diario' : 'semanal';
    const materialCount =
      materialType === 'unico' ? (r._materialPropioUnique || 0) : materialType === 'semanal' ? (r._materialPropioWeeks || 0) : (r._materialPropioDays || 0);
    const materialLabel =
      materialCount > 0
        ? materialType === 'unico'
          ? i18n.t('common.unique')
          : `${materialCount} ${materialType === 'semanal' ? 'semanas' : 'días'}`
        : '—';
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(materialLabel)}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalMaterialPropio, 2))}</td>`);
  }

  if (columnVisibility.dietas) {
    dataCells.push(`<td class="dietas-cell" style="text-align:center !important;vertical-align:middle !important;">${generateDietasText(r)}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDietas, 2))}</td>`);
  }

  if (columnVisibility.transporte) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.transporte))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalTrans, 2))}</td>`);
  }

  if (columnVisibility.km) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r.km, 1))}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalKm, 2))}</td>`);
  }

  if (columnVisibility.gasolina) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalGasolina, 2))}</td>`);
  }

  dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalBruto, 2))}</td>`);
  if (columnVisibility.netColumns) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._irpfPercent, 1))}${r._irpfPercent ? '%' : ''}</td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._estadoPercent, 1))}${r._estadoPercent ? '%' : ''}</td>`);
    if (columnVisibility.extraHoursPercent) {
      dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayValue(r._extraHoursPercent, 1))}${r._extraHoursPercent ? '%' : ''}</td>`);
    }
    dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalNeto, 2))}</td>`);
  }

  return dataCells;
};
