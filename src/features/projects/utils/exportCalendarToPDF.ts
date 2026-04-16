import jsPDF from 'jspdf';
import i18n from '../../../i18n/config';
import type { Project } from '../types';
import { storage } from '@shared/services/localStorage.service';
import { needsDataToPlanData } from '@shared/utils/needsPlanAdapter';
import { addDays, parseYYYYMMDD, toYYYYMMDD } from '@shared/utils/date';
import { shareOrSavePDF } from '@shared/utils/pdfShare';
import { translateWeekLabel } from '@features/necesidades/utils/export/helpers';

export type CalendarExportRange = 1 | 3 | 6 | 12;
export type CalendarExportScope = 'active' | 'all';

type ProjectCalendarMeta = {
  project: Project;
  color: string;
  textColor: string;
  days: Set<string>;
};

type CalendarDayEntry = {
  iso: string;
  projects: ProjectCalendarMeta[];
};

type WeekRow = Array<Date | null>;

type MonthPage = {
  key: string;
  label: string;
  weeks: WeekRow[];
  weekLabels: Record<number, string>;
  projectCount: number;
  activeDays: number;
  assignments: number;
};

type MonthInfo = {
  year: number;
  monthIndex: number;
  start: Date;
  end: Date;
  key: string;
};

const PAGE = {
  width: 297,
  height: 210,
  marginX: 6,
  marginTop: 6,
  marginBottom: 8,
};

const DAY_KEYS = [
  'reports.dayNames.monday',
  'reports.dayNames.tuesday',
  'reports.dayNames.wednesday',
  'reports.dayNames.thursday',
  'reports.dayNames.friday',
  'reports.dayNames.saturday',
  'reports.dayNames.sunday',
] as const;

const DAY_FALLBACKS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

const PALETTE = [
  '#B3DDF2',
  '#93C5FD',
  '#FCD34D',
  '#FDBA74',
  '#A7F3D0',
  '#C4B5FD',
  '#F9A8D4',
  '#FCA5A5',
];

function stripHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortText(value: unknown, max = 28): string {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getProjectColor(project: Project): string {
  const seed = `${project.id || ''}:${project.nombre || ''}`;
  return PALETTE[hashString(seed) % PALETTE.length];
}

function hexToRgb(hex: string): [number, number, number] {
  const safe = hex.replace('#', '');
  if (safe.length !== 6) return [148, 163, 184];
  return [
    parseInt(safe.slice(0, 2), 16),
    parseInt(safe.slice(2, 4), 16),
    parseInt(safe.slice(4, 6), 16),
  ];
}

function getTextColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
  return luminance > 170 ? '#0f172a' : '#ffffff';
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthLabel(date: Date): string {
  const locale = i18n.resolvedLanguage || i18n.language || 'es';
  const label = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getWeekMonday(date: Date): Date {
  const weekdayIndex = (date.getDay() + 6) % 7;
  return addDays(date, -weekdayIndex);
}

function getISOWeek(date: Date): number {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

function dateRangeOverlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  return !(endA < startB || startA > endB);
}

function hasDayContent(day: any): boolean {
  if (!day || typeof day !== 'object') return false;
  const stringFields = [
    day.tipo,
    day.crewTipo,
    day.prelightTipo,
    day.pickupTipo,
    day.refTipo,
    day.start,
    day.end,
    day.crewStart,
    day.crewEnd,
    day.preStart,
    day.preEnd,
    day.pickStart,
    day.pickEnd,
    day.refStart,
    day.refEnd,
  ];
  if (stringFields.some(value => String(value || '').trim() !== '')) return true;
  const listFields = [
    day.crewList,
    day.refList,
    day.preList,
    day.pickList,
    day.team,
    day.refBlocks,
  ];
  return listFields.some(value => Array.isArray(value) && value.length > 0);
}

function getScheduledDaysForProject(project: Project): Set<string> {
  const storageKey = `needs_${project.id || project.nombre || 'demo'}`;
  const raw = storage.getJSON<any>(storageKey);
  const plan = needsDataToPlanData(raw);
  const weeks = [...(plan.pre || []), ...(plan.pro || [])];
  const result = new Set<string>();

  weeks.forEach(week => {
    const startDate = String(week?.startDate || '').trim();
    if (!startDate) return;
    const monday = parseYYYYMMDD(startDate);
    for (let index = 0; index < 7; index += 1) {
      const day = week?.days?.[index];
      if (!hasDayContent(day)) continue;
      result.add(toYYYYMMDD(addDays(monday, index)));
    }
  });

  return result;
}

function buildMonthRange(months: CalendarExportRange): MonthInfo[] {
  const today = new Date();
  const firstMonth = startOfMonth(today);
  return Array.from({ length: months }, (_, index) => {
    const start = addMonths(firstMonth, index);
    const end = endOfMonth(start);
    return {
      year: start.getFullYear(),
      monthIndex: start.getMonth(),
      start,
      end,
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    };
  });
}

function getProjectsMeta(
  projects: Project[],
  scope: CalendarExportScope,
  months: MonthInfo[]
): ProjectCalendarMeta[] {
  if (months.length === 0) return [];
  const rangeStart = toYYYYMMDD(months[0].start);
  const rangeEnd = toYYYYMMDD(months[months.length - 1].end);

  return projects
    .filter(project => scope === 'all' || project.estado === 'Activo')
    .map(project => {
      const days = getScheduledDaysForProject(project);
      const color = getProjectColor(project);
      return {
        project,
        color,
        textColor: getTextColor(color),
        days,
      };
    })
    .filter(meta => {
      if (meta.days.size === 0) return false;
      const sortedDays = Array.from(meta.days).sort();
      return dateRangeOverlaps(sortedDays[0], sortedDays[sortedDays.length - 1], rangeStart, rangeEnd);
    });
}

function buildDayMap(projectsMeta: ProjectCalendarMeta[]): Map<string, CalendarDayEntry> {
  const byDate = new Map<string, CalendarDayEntry>();
  projectsMeta.forEach(meta => {
    Array.from(meta.days).forEach(iso => {
      const existing = byDate.get(iso);
      if (existing) {
        existing.projects.push(meta);
        return;
      }
      byDate.set(iso, { iso, projects: [meta] });
    });
  });

  byDate.forEach(entry => {
    entry.projects.sort((a, b) => a.project.nombre.localeCompare(b.project.nombre, i18n.language));
  });

  return byDate;
}

function buildMonthPages(months: MonthInfo[], dayMap: Map<string, CalendarDayEntry>): MonthPage[] {
  return months.map(month => {
    const daysInMonth = Array.from(dayMap.keys())
      .filter(iso => iso >= toYYYYMMDD(month.start) && iso <= toYYYYMMDD(month.end))
      .sort();
    const activeDates = daysInMonth.map(parseYYYYMMDD);
    const projectIds = new Set<string>();
    let assignments = 0;

    daysInMonth.forEach(iso => {
      const entry = dayMap.get(iso);
      if (!entry) return;
      assignments += entry.projects.length;
      entry.projects.forEach(meta => projectIds.add(meta.project.id));
    });

    const firstWeekday = (month.start.getDay() + 6) % 7;
    const lastWeekday = (month.end.getDay() + 6) % 7;
    const monthDates = Array.from({ length: month.end.getDate() }, (_, index) =>
      new Date(month.year, month.monthIndex, index + 1)
    );
    const cells: Array<Date | null> = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...monthDates,
      ...Array.from({ length: 6 - lastWeekday }, () => null),
    ];
    const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) =>
      cells.slice(index * 7, index * 7 + 7)
    );
    const weekLabels: Record<number, string> = {};
    weeks.forEach((week, index) => {
      const firstDate = week.find((date): date is Date => Boolean(date)) || monthDates[0];
      const monday = getWeekMonday(firstDate);
      weekLabels[index] = translateWeekLabel(
        i18n.t('planning.weekFormat', { number: getISOWeek(monday) })
      );
    });

    return {
      key: month.key,
      label: getMonthLabel(month.start),
      weeks,
      weekLabels,
      projectCount: projectIds.size,
      activeDays: activeDates.length,
      assignments,
    };
  });
}

function fillRoundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: [number, number, number],
  stroke: [number, number, number],
  radius = 4
) {
  pdf.setFillColor(...fill);
  pdf.setDrawColor(...stroke);
  pdf.roundedRect(x, y, w, h, radius, radius, 'FD');
}

function drawClampedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: 'left' | 'center' | 'right' = 'left'
) {
  const safe = stripHtml(text);
  if (!safe) return;
  const fitted = pdf.splitTextToSize(safe, maxWidth);
  const line = Array.isArray(fitted) ? String(fitted[0] || '') : String(fitted || '');
  pdf.text(line, x, y, { align, baseline: 'top', maxWidth });
}

function drawGradientBar(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  const steps = 48;
  for (let i = 0; i < steps; i += 1) {
    const t = i / Math.max(1, steps - 1);
    const r = Math.round(249 + (59 - 249) * t);
    const g = Math.round(115 + (130 - 115) * t);
    const b = Math.round(22 + (246 - 22) * t);
    const sx = x + (w * i) / steps;
    const sw = w / steps + 0.2;
    pdf.setFillColor(r, g, b);
    pdf.rect(sx, y, sw, h, 'F');
  }
}

function drawInfoItem(
  pdf: jsPDF,
  label: string,
  value: unknown,
  x: number,
  y: number,
  width: number,
  align: 'left' | 'right' = 'left'
) {
  const safe = stripHtml(value);
  if (!safe) return;
  const gap = 1.3;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);

  if (align === 'left') {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, y, { align: 'left', baseline: 'top', maxWidth: width });
    const labelWidth = pdf.getTextWidth(label);
    pdf.setFont('helvetica', 'normal');
    pdf.text(safe, x + labelWidth + gap, y, {
      align: 'left',
      baseline: 'top',
      maxWidth: Math.max(10, width - labelWidth - gap),
    });
    return;
  }

  pdf.setFont('helvetica', 'normal');
  const valueWidth = pdf.getTextWidth(safe);
  pdf.text(safe, x, y, { align: 'right', baseline: 'top', maxWidth: width });
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(label, x - valueWidth - gap, y, {
    align: 'right',
    baseline: 'top',
    maxWidth: Math.max(10, width - valueWidth - gap),
  });
}

function drawHeaderAndSummary(
  pdf: jsPDF,
  monthPage: MonthPage,
  scope: CalendarExportScope,
  range: CalendarExportRange,
  months: MonthInfo[]
) {
  const titleH = 14.5;
  const titleY = 0;
  const summaryY = titleY + titleH + 5.5;
  const summaryH = 23;
  const title = String(
    i18n.t('projects.calendarExportTitle', { defaultValue: 'Calendario global de proyectos' })
  ).toUpperCase();

  drawGradientBar(pdf, 0, titleY, PAGE.width, titleH);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.2);
  pdf.text(title, PAGE.width / 2, titleY + 4.6, { align: 'center', baseline: 'top' });

  fillRoundedRect(
    pdf,
    PAGE.marginX,
    summaryY,
    PAGE.width - PAGE.marginX * 2,
    summaryH,
    [241, 245, 249],
    [226, 232, 240],
    4
  );

  const rangeLabel =
    range === 1
      ? monthPage.label
      : `${getMonthLabel(months[0].start)} - ${getMonthLabel(months[months.length - 1].start)}`;
  const leftX = PAGE.marginX + 5;
  const rightX = PAGE.width - PAGE.marginX - 5;
  const leftW = 120;
  const rightW = 120;
  const leftYs = [summaryY + 5, summaryY + 11, summaryY + 17];
  const rightYs = [summaryY + 5, summaryY + 11, summaryY + 17];

  drawInfoItem(pdf, `${i18n.t('projects.calendarPreview', { defaultValue: 'Mes' })}:`, monthPage.label, leftX, leftYs[0], leftW);
  drawInfoItem(pdf, `${i18n.t('projects.calendarRange', { defaultValue: 'Rang' })}:`, rangeLabel, leftX, leftYs[1], leftW);
  drawInfoItem(
    pdf,
    `${i18n.t('projects.calendarProjectsScope', { defaultValue: 'Projectes' })}:`,
    i18n.t(
      scope === 'active' ? 'projects.calendarProjectsActive' : 'projects.calendarProjectsAll',
      { defaultValue: scope === 'active' ? 'Només actius' : 'Tots els projectes' }
    ),
    leftX,
    leftYs[2],
    leftW
  );

  drawInfoItem(pdf, `${i18n.t('projects.calendarProjects', { defaultValue: 'Projectes' })}:`, String(monthPage.projectCount), rightX, rightYs[0], rightW, 'right');
  drawInfoItem(pdf, `${i18n.t('projects.calendarAssignments', { defaultValue: 'Dies ocupats' })}:`, String(monthPage.assignments), rightX, rightYs[1], rightW, 'right');
  drawInfoItem(
    pdf,
    `${i18n.t('projects.calendarActiveDays', { defaultValue: 'Dies amb activitat' })}:`,
    String(monthPage.activeDays),
    rightX,
    rightYs[2],
    rightW,
    'right'
  );
}

function drawFooter(pdf: jsPDF) {
  const footerY = PAGE.height - 2.1;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(PAGE.marginX + 4, footerY - 4.3, PAGE.width - PAGE.marginX - 4, footerY - 4.3);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.7);
  const generated = i18n.t('pdf.generatedWith', { defaultValue: 'Generado con' });
  const generatedText = `${generated} `;
  const setText = 'Set';
  const luxText = 'Lux';
  const suffixText = ' · setlux.app';
  const generatedWidth = pdf.getTextWidth(generatedText);
  const setWidth = pdf.getTextWidth(setText);
  const luxWidth = pdf.getTextWidth(luxText);
  const suffixWidth = pdf.getTextWidth(suffixText);
  const footerStartX = (PAGE.width - (generatedWidth + setWidth + luxWidth + suffixWidth)) / 2;
  pdf.setTextColor(100, 116, 139);
  pdf.text(generatedText, footerStartX, footerY, { align: 'left', baseline: 'bottom' });
  pdf.setTextColor(249, 115, 22);
  pdf.text(setText, footerStartX + generatedWidth, footerY, { align: 'left', baseline: 'bottom' });
  pdf.setTextColor(59, 130, 246);
  pdf.text(luxText, footerStartX + generatedWidth + setWidth, footerY, { align: 'left', baseline: 'bottom' });
  pdf.setTextColor(100, 116, 139);
  pdf.text(suffixText, footerStartX + generatedWidth + setWidth + luxWidth, footerY, {
    align: 'left',
    baseline: 'bottom',
  });
}

function drawMonthPage(
  pdf: jsPDF,
  monthPage: MonthPage,
  dayMap: Map<string, CalendarDayEntry>,
  scope: CalendarExportScope,
  range: CalendarExportRange,
  months: MonthInfo[]
) {
  drawHeaderAndSummary(pdf, monthPage, scope, range, months);

  const summaryY = 14.5 + 5.5;
  const summaryH = 23;
  const monthTitleY = summaryY + summaryH + 5;
  const gridY = monthTitleY + 5.4;
  const footerH = 3.8;
  const weekGap = 1.15;
  const availableH = PAGE.height - PAGE.marginBottom - footerH - gridY;
  const weekCount = Math.max(1, monthPage.weeks.length);
  const sectionH = (availableH - weekGap * (weekCount - 1)) / weekCount;
  const dayHeaderH = 6.4;
  const cellW = (PAGE.width - PAGE.marginX * 2) / 7;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text(monthPage.label, PAGE.marginX, monthTitleY, { baseline: 'top' });

  monthPage.weeks.forEach((week, weekIndex) => {
    const sectionY = gridY + weekIndex * (sectionH + weekGap);
    const headerY = sectionY;
    const bodyY = headerY + dayHeaderH;
    const bodyH = Math.max(13.5, sectionH - dayHeaderH);

    week.forEach((date, dayIndex) => {
      const x = PAGE.marginX + dayIndex * cellW;

      pdf.setFillColor(82, 96, 138);
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, headerY, cellW, dayHeaderH, 'FD');

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, bodyY, cellW, bodyH, 'FD');

      if (!date) return;

      const iso = toYYYYMMDD(date);
      const entry = dayMap.get(iso);
      const weekdayIndex = (date.getDay() + 6) % 7;
      const dayName = i18n.t(DAY_KEYS[weekdayIndex], { defaultValue: DAY_FALLBACKS[weekdayIndex] });

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.3);
      pdf.text(String(dayName).toUpperCase(), x + cellW / 2, headerY + 0.9, {
        align: 'center',
        baseline: 'top',
      });
      pdf.setFontSize(6.4);
      pdf.text(String(date.getDate()).padStart(2, '0'), x + cellW / 2, headerY + 3, {
        align: 'center',
        baseline: 'top',
      });

      const projects = entry?.projects || [];
      if (projects.length === 0) return;

      const padX = x + 0.9;
      const innerW = cellW - 1.8;
      const chipGap = 0.7;
      const chipH = 5.1;
      const maxVisible = Math.max(1, Math.min(4, Math.floor((bodyH - 2.2) / (chipH + chipGap))));
      const visibleProjects = projects.slice(0, maxVisible);
      const remaining = Math.max(0, projects.length - visibleProjects.length);
      let currentY = bodyY + 0.9;

      visibleProjects.forEach(meta => {
        const [r, g, b] = hexToRgb(meta.color);
        pdf.setFillColor(r, g, b);
        pdf.setDrawColor(r, g, b);
        pdf.roundedRect(padX, currentY, innerW, chipH, 0.9, 0.9, 'FD');
        const textColor = meta.textColor === '#ffffff' ? [255, 255, 255] as const : [15, 23, 42] as const;
        pdf.setTextColor(...textColor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.6);
        drawClampedText(pdf, shortText(meta.project.nombre, 30), padX + 0.7, currentY + 0.8, innerW - 1.4);
        currentY += chipH + chipGap;
      });

      if (remaining > 0 && currentY < bodyY + bodyH - 2) {
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.6);
        drawClampedText(
          pdf,
          i18n.t('projects.calendarMoreProjects', { count: remaining, defaultValue: `+${remaining} más` }),
          padX + 0.3,
          currentY,
          innerW - 0.6
        );
      }
    });
  });

  drawFooter(pdf);
}

export async function exportProjectsCalendarToPDF(params: {
  projects: Project[];
  range: CalendarExportRange;
  scope: CalendarExportScope;
}): Promise<boolean> {
  try {
    const months = buildMonthRange(params.range);
    const projectsMeta = getProjectsMeta(params.projects, params.scope, months);
    if (projectsMeta.length === 0) return false;

    const dayMap = buildDayMap(projectsMeta);
    const pages = buildMonthPages(months, dayMap);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    pages.forEach((page, index) => {
      if (index > 0) pdf.addPage();
      drawMonthPage(pdf, page, dayMap, params.scope, params.range, months);
    });

    const firstLabel = months[0]?.key || '';
    const lastLabel = months[months.length - 1]?.key || firstLabel;
    const filename = `Calendari_projectes_${firstLabel}${lastLabel && lastLabel !== firstLabel ? `_${lastLabel}` : ''}.pdf`;
    await shareOrSavePDF(
      pdf,
      filename,
      i18n.t('projects.calendarExportTitle', { defaultValue: 'Calendari global de projectes' })
    );
    return true;
  } catch (error) {
    console.error('Error exporting projects calendar PDF:', error);
    return false;
  }
}
