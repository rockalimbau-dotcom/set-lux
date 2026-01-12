import i18n from '../../../../i18n/config';
import { esc, displayValue, displayMoney, generateWorkedDaysText, generateExtrasText, generateDietasText, getColumnVisibility } from './helpers';

/**
 * Generate header cells based on column visibility
 */
export const generateHeaderCells = (columnVisibility: ReturnType<typeof getColumnVisibility>): string[] => {
  const headerCells = [
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.person')}</th>`,
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.workedDays')}</th>`,
    `<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalDays')}</th>`,
  ];

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

  headerCells.push(`<th style="text-align:center !important;vertical-align:middle !important;">${i18n.t('payroll.totalBruto')}</th>`);

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
  const dataCells = [
    `<td class="text-left" style="font-weight:600;vertical-align:middle !important;">${esc(roleForDisplay)} — ${esc(r.name)}</td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;">${generateWorkedDaysText(r) || esc(displayValue(r._worked))}</td>`,
    `<td style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalDias, 2))}</td>`,
  ];

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

  dataCells.push(`<td class="total-cell" style="text-align:center !important;vertical-align:middle !important;">${esc(displayMoney(r._totalBruto, 2))}</td>`);

  return dataCells;
};

