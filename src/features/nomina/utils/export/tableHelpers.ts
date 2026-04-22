import i18n from '../../../../i18n/config';
import { applyGenderToBadge, getRoleBadgeCode } from '@shared/constants/roles';
import { esc, displayValue, displayMoney, generateWorkedDaysText, generateExtrasText, generateDietasText, generateCargaDescargaText, getColumnVisibility } from './helpers';

/**
 * Generate header cells based on column visibility
 */
export const generateHeaderCells = (
  columnVisibility: ReturnType<typeof getColumnVisibility>,
  projectMode: 'semanal' | 'mensual' | 'diario' = 'semanal',
  options: {
    forPDF?: boolean;
    useNetAmounts?: boolean;
    showIrpfColumn?: boolean;
    showEstadoColumn?: boolean;
    showExtraHoursNetColumn?: boolean;
  } = {}
): string[] => {
  const {
    forPDF = false,
    useNetAmounts = false,
    showIrpfColumn = true,
    showEstadoColumn = true,
    showExtraHoursNetColumn = true,
  } = options;
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
    `<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.person')}</div></th>`,
    `<th style="${workedStyle}"><div class="th-label">${workedLabel}</div></th>`,
    `<th style="${totalWorkedStyle}"><div class="th-label">${totalWorkedLabel}</div></th>`,
  ];

  if (columnVisibility.halfDays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.halfDays')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalHalfDays')}</div></th>`);
  }

  if (columnVisibility.localizacion) {
    headerCells.push(`<th style="${localizacionStyle}"><div class="th-label">${localizacionLabel}</div></th>`);
    headerCells.push(`<th style="${totalLocalizacionStyle}"><div class="th-label">${totalLocalizacionLabel}</div></th>`);
  }

  if (columnVisibility.cargaDescarga) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.cargaDescarga')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalCargaDescarga')}</div></th>`);
  }

  if (columnVisibility.holidays) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.holidayDays')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalHolidayDays')}</div></th>`);
  }

  if (columnVisibility.travel) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.travelDays')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalTravelDays')}</div></th>`);
  }

  if (columnVisibility.extras) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.extraHours')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalExtraHours')}</div></th>`);
  }

  if (columnVisibility.materialPropio) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.ownMaterial')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalOwnMaterial')}</div></th>`);
  }

  if (columnVisibility.dietas) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.dietas')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalDietas')}</div></th>`);
  }

  if (columnVisibility.transporte) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.transportes')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalTransportes')}</div></th>`);
  }

  if (columnVisibility.km) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.kilometraje')}</div></th>`);
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalKilometraje')}</div></th>`);
  }

  if (columnVisibility.gasolina) {
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalGasoline')}</div></th>`);
  }

  headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalBruto')}</div></th>`);
  if (columnVisibility.netColumns) {
    if (showIrpfColumn) {
      headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.irpf')}</div></th>`);
    }
    if (showEstadoColumn) {
      headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.stateTax')}</div></th>`);
    }
    if (columnVisibility.extraHoursPercent && showExtraHoursNetColumn) {
      headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${useNetAmounts ? i18n.t('payroll.extraHours') : i18n.t('payroll.extraHoursPercentColumn')}</div></th>`);
    }
    headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;"><div class="th-label">${i18n.t('payroll.totalNet')}</div></th>`);
  }

  return headerCells;
};

/**
 * Generate data cells for a row
 */
export const generateRowDataCells = (
  r: any,
  columnVisibility: ReturnType<typeof getColumnVisibility>,
  options: {
    projectMode?: 'semanal' | 'mensual' | 'diario';
    useNetAmounts?: boolean;
    showIrpfColumn?: boolean;
    showEstadoColumn?: boolean;
    showExtraHoursNetColumn?: boolean;
  } = {}
): string[] => {
  const {
    projectMode = 'semanal',
    useNetAmounts = false,
    showIrpfColumn = true,
    showEstadoColumn = true,
    showExtraHoursNetColumn = true,
  } = options;
  const roleForDisplay = (r as any)._originalRole || r.role || '';
  const roleDisplay = applyGenderToBadge(getRoleBadgeCode(String(roleForDisplay), i18n.language), (r as any).gender);
  const dataCells = [
    `<td class="text-left person-cell" style="font-weight:600;vertical-align:middle !important;"><div class="person-chip-wrap"><div class="member-chip-line"><span class="member-chip-badge"><span class="member-chip-badge-text">${esc(roleDisplay || '—')}</span></span><span class="member-chip-name"><span class="member-chip-name-text">${esc(r.name || '—')}</span></span></div></div></td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${generateWorkedDaysText(r, { includeCargaDescarga: projectMode !== 'diario' }) || esc(displayValue(r._worked))}</div></td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalDias, 2))}</div></td>`,
  ];

  if (columnVisibility.halfDays) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r._halfDays))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalHalfDays, 2))}</div></td>`);
  }

  if (columnVisibility.localizacion) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r._localizarDays))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalLocalizacion, 2))}</div></td>`);
  }

  if (columnVisibility.cargaDescarga) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${generateCargaDescargaText(r) || esc(displayValue((r._cargaDays || 0) + (r._descargaDays || 0)))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalCargaDescarga, 2))}</div></td>`);
  }

  if (columnVisibility.holidays) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r._holidays))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalHolidays, 2))}</div></td>`);
  }

  if (columnVisibility.travel) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r._travel))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalTravel, 2))}</div></td>`);
  }

  if (columnVisibility.extras) {
    dataCells.push(`<td class="extras-cell" style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${generateExtrasText(r)}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalExtras, 2))}</div></td>`);
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
        : '';
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(materialLabel)}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalMaterialPropio, 2))}</div></td>`);
  }

  if (columnVisibility.dietas) {
    dataCells.push(`<td class="dietas-cell" style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${generateDietasText(r)}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalDietas, 2))}</div></td>`);
  }

  if (columnVisibility.transporte) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r.transporte))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalTrans, 2))}</div></td>`);
  }

  if (columnVisibility.km) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayValue(r.km, 1))}</div></td>`);
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalKm, 2))}</div></td>`);
  }

  if (columnVisibility.gasolina) {
    dataCells.push(`<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalGasolina, 2))}</div></td>`);
  }

  dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalBruto, 2))}</div></td>`);
  if (columnVisibility.netColumns) {
    if (showIrpfColumn) {
      dataCells.push(
        `<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${
          useNetAmounts
            ? esc(displayMoney(r._irpfAmount, 2))
            : `${esc(displayValue(r._irpfPercent, 1))}${r._irpfPercent ? '%' : ''}`
        }</div></td>`
      );
    }
    if (showEstadoColumn) {
      dataCells.push(
        `<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${
          useNetAmounts
            ? esc(displayMoney(r._estadoAmount, 2))
            : `${esc(displayValue(r._estadoPercent, 1))}${r._estadoPercent ? '%' : ''}`
        }</div></td>`
      );
    }
    if (columnVisibility.extraHoursPercent && showExtraHoursNetColumn) {
      dataCells.push(
        `<td style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${
          useNetAmounts
            ? esc(displayMoney(r._extraHoursAmount, 2))
            : `${esc(displayValue(r._extraHoursPercent, 1))}${r._extraHoursPercent ? '%' : ''}`
        }</div></td>`
      );
    }
    dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;"><div class="td-label td-label-center">${esc(displayMoney(r._totalNeto, 2))}</div></td>`);
  }

  return dataCells;
};
