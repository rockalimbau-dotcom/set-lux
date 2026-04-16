import jsPDF from 'jspdf';
import i18n from '../../../i18n/config';
import { AnyRecord } from '@shared/types/common';
import { addDays, parseYYYYMMDD, toYYYYMMDD } from '@shared/utils/date';
import { shareOrSavePDF } from '@shared/utils/pdfShare';
import { translateWeekLabel } from './export/helpers';

type CalendarDayData = {
  iso: string;
  day: AnyRecord;
  scope: 'pre' | 'pro';
};

type MonthPage = {
  key: string;
  label: string;
  weeks: Array<Array<Date | null>>;
  activeDays: number;
  sectionMarkers: Record<number, string>;
  weekLabels: Record<number, string>;
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

const PAGE = {
  width: 297,
  height: 210,
  marginX: 6,
  marginTop: 6,
  marginBottom: 8,
};

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

function firstName(value: string): string {
  const clean = stripHtml(value);
  return clean.split(/\s+/)[0] || clean;
}

function normalizeTime(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^\d{1,2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{3,4}$/.test(raw)) {
    const padded = raw.padStart(4, '0');
    return `${padded.slice(0, 2)}:${padded.slice(2)}`;
  }
  return raw;
}

function getDaySchedule(day: AnyRecord): string {
  const start =
    normalizeTime(day?.crewStart) ||
    normalizeTime(day?.start) ||
    normalizeTime(day?.preStart) ||
    normalizeTime(day?.pickStart) ||
    normalizeTime(day?.refStart) ||
    normalizeTime(day?.refBlocks?.[0]?.start);
  const end =
    normalizeTime(day?.crewEnd) ||
    normalizeTime(day?.end) ||
    normalizeTime(day?.preEnd) ||
    normalizeTime(day?.pickEnd) ||
    normalizeTime(day?.refEnd) ||
    normalizeTime(day?.refBlocks?.[0]?.end);

  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

function getTeamSummary(day: AnyRecord): string {
  const crewList = Array.isArray(day?.crewList) ? day.crewList : [];
  const names = crewList
    .map((member: AnyRecord) => firstName(String(member?.name || member?.roleLabel || member?.role || '')))
    .filter(Boolean);
  const visibleNames = names.slice(0, 3);
  const extra = Math.max(0, names.length - visibleNames.length);
  const base = visibleNames.join(', ');
  if (extra > 0) return `${base}${base ? ' ' : ''}+${extra}`;
  return base;
}

function isRestDay(day: AnyRecord): boolean {
  const tipo = String(day?.crewTipo || day?.tipo || '').trim().toLowerCase();
  return tipo === 'descanso' || tipo === 'fin';
}

function hasContent(day: AnyRecord): boolean {
  if (!day || typeof day !== 'object') return false;
  return [
    day?.tipo,
    day?.crewTipo,
    day?.loc,
    day?.crewStart,
    day?.crewEnd,
    day?.start,
    day?.end,
    day?.preStart,
    day?.preEnd,
    day?.pickStart,
    day?.pickEnd,
  ].some(value => String(value ?? '').trim() !== '') ||
    (Array.isArray(day?.crewList) && day.crewList.length > 0);
}

function collectProjectDays(weeks: AnyRecord[]): Map<string, CalendarDayData> {
  const byDate = new Map<string, CalendarDayData>();

  weeks
    .filter(week => String(week?.startDate || '').trim() !== '')
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .forEach(week => {
      const scope = String(week?.__calendarScope || week?.scope || '').trim() === 'pre' ? 'pre' : 'pro';
      const start = parseYYYYMMDD(String(week.startDate));
      const days = Array.isArray(week?.days) ? week.days : [];
      days.forEach((day: AnyRecord, index: number) => {
        const iso = toYYYYMMDD(addDays(start, index));
        if (hasContent(day || {})) {
          byDate.set(iso, { iso, day: day || {}, scope });
        }
      });
    });

  return byDate;
}

function buildWeekLabelMap(weeks: AnyRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  weeks.forEach(week => {
    const startDate = String(week?.startDate || '').trim();
    if (!startDate) return;
    map.set(startDate, translateWeekLabel(String(week?.label || '')));
  });
  return map;
}

function buildMonthPages(byDate: Map<string, CalendarDayData>, weekLabelByMonday: Map<string, string>): MonthPage[] {
  const grouped = new Map<string, Date[]>();

  Array.from(byDate.keys())
    .sort()
    .forEach(iso => {
      const date = parseYYYYMMDD(iso);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = grouped.get(key) || [];
      bucket.push(date);
      grouped.set(key, bucket);
    });

  const seenScopes = new Set<string>();

  return Array.from(grouped.entries()).map(([key, dates]) => {
    const ordered = dates.sort((a, b) => a.getTime() - b.getTime());
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const firstWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const lastWeekday = last.getDay() === 0 ? 6 : last.getDay() - 1;
    const cells = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...ordered,
      ...Array.from({ length: 6 - lastWeekday }, () => null),
    ];
    const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) =>
      cells.slice(index * 7, index * 7 + 7)
    );
    const sectionMarkers: Record<number, string> = {};
    const weekLabels: Record<number, string> = {};
    weeks.forEach((week, index) => {
      const firstDate = week.find((date): date is Date => Boolean(date));
      if (!firstDate) return;
      const weekdayIndex = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1;
      const mondayIso = toYYYYMMDD(addDays(firstDate, -weekdayIndex));
      weekLabels[index] =
        weekLabelByMonday.get(mondayIso) ||
        translateWeekLabel(i18n.t('planning.weekFormat', { number: index + 1 }));
      const scope = byDate.get(toYYYYMMDD(firstDate))?.scope;
      if (!scope || seenScopes.has(scope)) return;
      seenScopes.add(scope);
      sectionMarkers[index] = i18n.t(
        scope === 'pre' ? 'planning.preproduction' : 'planning.production',
        { defaultValue: scope === 'pre' ? 'Preproducción' : 'Producción' }
      );
    });
    const locale = i18n.resolvedLanguage || i18n.language || 'es';
    const label = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
    }).format(first);

    return {
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      weeks,
      activeDays: ordered.length,
      sectionMarkers,
      weekLabels,
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

function drawMonthPage(
  pdf: jsPDF,
  project: AnyRecord,
  monthPage: MonthPage,
  byDate: Map<string, CalendarDayData>
) {
  const titleH = 14.5;
  const titleY = 0;
  const summaryY = titleY + titleH + 5.5;
  const summaryH = 33;
  const monthTitleY = summaryY + summaryH + 5;
  const gridY = monthTitleY + 7;
  const footerH = 3.8;
  const weekGap = 1.1;
  const availableH = PAGE.height - PAGE.marginBottom - footerH - gridY;
  const weekCount = Math.max(1, monthPage.weeks.length);
  const sectionH = (availableH - weekGap * (weekCount - 1)) / weekCount;
  const weekBandH = 4.6;
  const dayHeaderH = 6.4;
  const bodyH = Math.max(12.5, sectionH - weekBandH - dayHeaderH);
  const cellW = (PAGE.width - PAGE.marginX * 2) / 7;

  const titleW = PAGE.width;
  drawGradientBar(pdf, 0, titleY, titleW, titleH);

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13.2);
  pdf.text(
    String(i18n.t('pdf.calendarTitle', { defaultValue: 'Calendario Eléctricos' })).toUpperCase(),
    PAGE.width / 2,
    titleY + 4.6,
    { align: 'center', baseline: 'top' }
  );

  fillRoundedRect(pdf, PAGE.marginX, summaryY, PAGE.width - PAGE.marginX * 2, summaryH, [241, 245, 249], [226, 232, 240], 4);
  const leftX = PAGE.marginX + 5;
  const rightX = PAGE.width - PAGE.marginX - 5;
  const leftW = 120;
  const rightW = 120;
  const leftYs = [summaryY + 5, summaryY + 11, summaryY + 17, summaryY + 23, summaryY + 29];
  const rightYs = [summaryY + 5, summaryY + 11, summaryY + 17, summaryY + 23, summaryY + 29];

  drawInfoItem(pdf, `${i18n.t('pdf.production', { defaultValue: 'Producción' })}:`, project?.productora || project?.produccion, leftX, leftYs[0], leftW);
  drawInfoItem(pdf, `${i18n.t('pdf.project', { defaultValue: 'Proyecto' })}:`, project?.nombre, leftX, leftYs[1], leftW);
  drawInfoItem(pdf, `${i18n.t('pdf.warehouse', { defaultValue: 'Magatzem' })}:`, project?.almacen, leftX, leftYs[2], leftW);
  drawInfoItem(pdf, `${i18n.t('pdf.productionManager', { defaultValue: 'Cap de producció' })}:`, (project as AnyRecord)?.jefeProduccion, leftX, leftYs[3], leftW);
  drawInfoItem(pdf, `${i18n.t('pdf.transport', { defaultValue: 'Cap de transports' })}:`, (project as AnyRecord)?.transportes, leftX, leftYs[4], leftW);

  drawInfoItem(pdf, `${i18n.t('pdf.dop', { defaultValue: 'DoP' })}:`, project?.dop, rightX, rightYs[0], rightW, 'right');
  drawInfoItem(pdf, `${i18n.t('pdf.gaffer', { defaultValue: 'Gaffer' })}:`, (project as AnyRecord)?.gaffer, rightX, rightYs[1], rightW, 'right');
  drawInfoItem(pdf, `${i18n.t('pdf.bestBoy', { defaultValue: 'Best boy' })}:`, (project as AnyRecord)?.bestBoy, rightX, rightYs[2], rightW, 'right');
  drawInfoItem(pdf, `${i18n.t('pdf.locations', { defaultValue: 'Cap de localitzacions' })}:`, (project as AnyRecord)?.localizaciones, rightX, rightYs[3], rightW, 'right');
  drawInfoItem(pdf, `${i18n.t('pdf.productionCoordinator', { defaultValue: 'Coordinadora de producció' })}:`, (project as AnyRecord)?.coordinadoraProduccion, rightX, rightYs[4], rightW, 'right');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text(monthPage.label, PAGE.marginX, monthTitleY, { baseline: 'top' });

  monthPage.weeks.forEach((week, weekIndex) => {
    const sectionMarker = monthPage.sectionMarkers[weekIndex];
    const sectionMarkerH = sectionMarker ? 4.8 : 0;
    const sectionY = gridY + weekIndex * (sectionH + weekGap);
    const weekBandY = sectionY + sectionMarkerH;
    const headerY = weekBandY + weekBandH;
    const bodyY = headerY + dayHeaderH;
    const bodyHLocal = Math.max(10.5, sectionH - sectionMarkerH - weekBandH - dayHeaderH);

    if (sectionMarker) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.8);
      pdf.setTextColor(30, 41, 59);
      pdf.text(sectionMarker, PAGE.marginX, sectionY + 0.3, { baseline: 'top' });
    }

    pdf.setFillColor(255, 236, 122);
    pdf.setDrawColor(240, 198, 54);
    pdf.rect(PAGE.marginX, weekBandY, PAGE.width - PAGE.marginX * 2, weekBandH, 'FD');
    pdf.setTextColor(68, 49, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.2);
    pdf.text(
      String(monthPage.weekLabels[weekIndex] || translateWeekLabel(i18n.t('planning.weekFormat', { number: weekIndex + 1 }))).toUpperCase(),
      PAGE.width / 2,
      weekBandY + 1.2,
      {
        align: 'center',
        baseline: 'top',
      }
    );

    week.forEach((date, dayIndex) => {
      const x = PAGE.marginX + dayIndex * cellW;

      pdf.setFillColor(82, 96, 138);
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, headerY, cellW, dayHeaderH, 'FD');

      if (!date) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, bodyY, cellW, bodyHLocal, 'FD');
        return;
      }

      const info = byDate.get(toYYYYMMDD(date));
      const day = info?.day || {};
      const rest = isRestDay(day);
      const schedule = getDaySchedule(day);
      const location = shortText(day?.loc, 24);
      const team = shortText(getTeamSummary(day), 26);
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

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, bodyY, cellW, bodyHLocal, 'FD');

      const padX = x + 0.9;
      const innerW = cellW - 1.8;
      const gapY = 0.7;
      let currentY = bodyY + 0.9;

      const bandH = Math.max(3.2, Math.min(3.8, bodyHLocal * 0.22));

      pdf.setFillColor(rest ? 254 : 255, rest ? 226 : 243, rest ? 226 : 244);
      pdf.setDrawColor(rest ? 239 : 255, rest ? 68 : 214, rest ? 68 : 153);
      pdf.roundedRect(padX, currentY, innerW, bandH, 0.9, 0.9, 'FD');
      pdf.setTextColor(rest ? 185 : 14, rest ? 28 : 116, rest ? 28 : 144);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.8);
      drawClampedText(
        pdf,
        rest ? i18n.t('planning.rest', { defaultValue: 'Descanso' }) : (schedule || i18n.t('planning.shooting', { defaultValue: 'Rodaje' })),
        padX + 0.7,
        currentY + 0.45,
        innerW - 1.4
      );

      if (!rest) {
        currentY += bandH + gapY;
        pdf.setFillColor(255, 251, 235);
        pdf.setDrawColor(253, 230, 138);
        pdf.roundedRect(padX, currentY, innerW, bandH, 0.9, 0.9, 'FD');
        pdf.setTextColor(146, 64, 14);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.3);
        drawClampedText(pdf, location || ' ', padX + 0.7, currentY + 0.55, innerW - 1.4);

        currentY += bandH + gapY;
        const teamH = Math.max(3.8, bodyY + bodyHLocal - currentY - 0.9);
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(147, 197, 253);
        pdf.roundedRect(padX, currentY, innerW, teamH, 0.9, 0.9, 'FD');
        pdf.setTextColor(30, 64, 175);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.4);
        drawClampedText(pdf, team || ' ', padX + 0.7, currentY + 0.6, innerW - 1.4);
      }
    });
  });

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

export async function exportProjectCalendarToPDF(project: AnyRecord, weeks: AnyRecord[]): Promise<boolean> {
  try {
    const validWeeks = (weeks || []).filter(week => String(week?.startDate || '').trim() !== '');
    if (validWeeks.length === 0) return false;

    const byDate = collectProjectDays(validWeeks);
    const weekLabelByMonday = buildWeekLabelMap(validWeeks);
    const pages = buildMonthPages(byDate, weekLabelByMonday);
    if (pages.length === 0) return false;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    pages.forEach((page, index) => {
      if (index > 0) pdf.addPage();
      drawMonthPage(pdf, project, page, byDate);
    });

    const safeProjectName = String(project?.nombre || i18n.t('common.project', { defaultValue: 'Proyecto' }))
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
    const calendarLabel = String(i18n.t('projects.calendarExport', { defaultValue: 'Calendario' }))
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
    const fallbackProject = String(i18n.t('common.project', { defaultValue: 'Proyecto' }))
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${calendarLabel || 'Calendario'}_${safeProjectName || fallbackProject || 'Proyecto'}.pdf`;
    await shareOrSavePDF(pdf, filename, i18n.t('needs.calendarTitle', { defaultValue: 'Calendario Eléctricos' }));
    return true;
  } catch (error) {
    console.error('Error exporting project calendar PDF:', error);
    return false;
  }
}
