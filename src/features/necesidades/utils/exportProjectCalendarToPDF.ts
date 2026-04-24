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

type PdfPalette = {
  fill: [number, number, number];
  stroke: [number, number, number];
  text: [number, number, number];
};

type TeamBlock = {
  label: string;
  members: string;
  schedule: string;
  palette: PdfPalette;
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

function normalizeDayType(value: unknown): string {
  return stripHtml(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function firstName(value: string): string {
  const clean = stripHtml(value);
  return clean.split(/\s+/)[0] || clean;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function getListSummary(list: AnyRecord[], maxVisible = 3): string {
  const names = list
    .map((member: AnyRecord) => firstName(String(member?.name || member?.roleLabel || member?.role || '')))
    .filter(Boolean);
  const visibleNames = names.slice(0, maxVisible);
  const extra = Math.max(0, names.length - visibleNames.length);
  const base = visibleNames.join(', ');
  if (extra > 0) return `${base}${base ? ' ' : ''}+${extra}`;
  if (!base && list.length > 0) return `${list.length} pax`;
  return base;
}

function getFullListText(list: AnyRecord[]): string {
  const names = uniqueStrings(
    list
      .map((member: AnyRecord) => firstName(String(member?.name || member?.roleLabel || member?.role || '')))
      .filter(Boolean)
  );
  return names.join(', ');
}

function isRestDay(day: AnyRecord): boolean {
  const tipo = normalizeDayType(day?.crewTipo || day?.tipo);
  return tipo === 'descanso' || tipo === 'fin';
}

function flattenRefMembers(day: AnyRecord): AnyRecord[] {
  const directList = Array.isArray(day?.refList) ? day.refList : [];
  const blockLists = Array.isArray(day?.refBlocks)
    ? day.refBlocks.flatMap((block: AnyRecord) => (Array.isArray(block?.list) ? block.list : []))
    : [];
  return [...directList, ...blockLists];
}

function getPaletteForNormalizedDayType(type: string): PdfPalette {
  switch (type) {
    case 'rodaje':
      return { fill: [219, 234, 254], stroke: [96, 165, 250], text: [29, 78, 216] };
    case 'rodaje festivo':
      return { fill: [255, 228, 230], stroke: [251, 113, 133], text: [190, 18, 60] };
    case 'carga':
    case 'descarga':
      return { fill: [255, 237, 213], stroke: [251, 146, 60], text: [194, 65, 12] };
    case 'prelight':
    case 'recogida':
      return { fill: [254, 243, 199], stroke: [245, 158, 11], text: [146, 64, 14] };
    case 'localizar':
    case 'oficina':
      return { fill: [207, 250, 254], stroke: [34, 211, 238], text: [14, 116, 144] };
    case 'pruebas de cámara':
    case 'pruebas de camara':
      return { fill: [237, 233, 254], stroke: [167, 139, 250], text: [109, 40, 217] };
    case 'travel day':
    case 'travel':
    case '1/2 jornada':
      return { fill: [204, 251, 241], stroke: [45, 212, 191], text: [15, 118, 110] };
    case 'descanso':
      return { fill: [226, 232, 240], stroke: [107, 114, 128], text: [51, 65, 85] };
    case 'fin':
      return { fill: [226, 232, 240], stroke: [107, 114, 128], text: [51, 65, 85] };
    default:
      return { fill: [239, 246, 255], stroke: [96, 165, 250], text: [29, 78, 216] };
  }
}

function getPrimaryDayType(day: AnyRecord): string {
  const crewType = normalizeDayType(day?.crewTipo || day?.tipo);
  const preType = normalizeDayType(day?.prelightTipo || day?.preTipo);
  const pickType = normalizeDayType(day?.pickupTipo || day?.pickTipo);
  const refType = normalizeDayType(day?.refTipo);

  if (crewType) return crewType;
  if (preType || (Array.isArray(day?.preList) && day.preList.length > 0)) return preType || 'prelight';
  if (pickType || (Array.isArray(day?.pickList) && day.pickList.length > 0)) return pickType || 'pickup';
  if (refType || flattenRefMembers(day).length > 0) return refType || 'refuerzo';
  return '';
}

function getDayTypeLabel(day: AnyRecord): string {
  const type = getPrimaryDayType(day);
  switch (type) {
    case 'descanso':
    case 'fin':
      return i18n.t('planning.rest', { defaultValue: 'Descanso' });
    case 'rodaje festivo':
      return i18n.t('planning.holidayShoot', { defaultValue: 'Rodaje festivo' });
    case 'rodaje':
      return i18n.t('planning.shooting', { defaultValue: 'Rodaje' });
    case 'prelight':
      return i18n.t('needs.prelight', { defaultValue: 'Prelight' });
    case 'pickup':
      return i18n.t('needs.pickup', { defaultValue: 'Pickup' });
    case 'refuerzo':
      return i18n.t('needs.reinforcements', { defaultValue: 'Refuerzos' });
    case 'carga':
      return i18n.t('planning.loading', { defaultValue: 'Carga' });
    case 'descarga':
      return i18n.t('planning.unloading', { defaultValue: 'Descarga' });
    case 'oficina':
      return i18n.t('planning.office', { defaultValue: 'Oficina' });
    case 'localizar':
      return i18n.t('planning.location', { defaultValue: 'Localizar' });
    case 'pruebas de cámara':
    case 'pruebas de camara':
      return i18n.t('planning.cameraTests', { defaultValue: 'Pruebas de cámara' });
    case 'travel':
    case 'travel day':
      return i18n.t('planning.travelDay', { defaultValue: 'Travel day' });
    case '1/2 jornada':
      return i18n.t('planning.halfDay', { defaultValue: '1/2 jornada' });
    default:
      return stripHtml(day?.crewTipo || day?.tipo || day?.prelightTipo || day?.pickupTipo || day?.refTipo) || i18n.t('planning.shooting', { defaultValue: 'Rodaje' });
  }
}

function getDayTypePalette(day: AnyRecord): {
  fill: [number, number, number];
  stroke: [number, number, number];
  text: [number, number, number];
} {
  const type = getPrimaryDayType(day);
  return getPaletteForNormalizedDayType(type);
}

function getTeamSummary(day: AnyRecord): string {
  const primaryType = getPrimaryDayType(day);
  const refMembers = flattenRefMembers(day);
  let list: AnyRecord[] = [];

  if (primaryType === 'prelight') {
    list = Array.isArray(day?.preList) ? day.preList : [];
  } else if (primaryType === 'pickup') {
    list = Array.isArray(day?.pickList) ? day.pickList : [];
  } else if (primaryType === 'refuerzo') {
    list = refMembers;
  } else {
    list = Array.isArray(day?.crewList) ? day.crewList : [];
  }

  if (list.length > 0) return getListSummary(list);

  const fallbackLists = [
    ...(Array.isArray(day?.crewList) ? [day.crewList] : []),
    ...(Array.isArray(day?.preList) ? [day.preList] : []),
    ...(Array.isArray(day?.pickList) ? [day.pickList] : []),
    ...(refMembers.length > 0 ? [refMembers] : []),
  ].filter(listValue => Array.isArray(listValue) && listValue.length > 0) as AnyRecord[][];

  if (fallbackLists.length === 0) return '';
  return getListSummary(fallbackLists[0]);
}

function getScheduleForKeys(day: AnyRecord, startKey: string, endKey: string): string {
  const start = normalizeTime(day?.[startKey]);
  const end = normalizeTime(day?.[endKey]);
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

function getRefBlockSchedule(block: AnyRecord): string {
  const start = normalizeTime(block?.start);
  const end = normalizeTime(block?.end);
  if (start && end) return `${start} - ${end}`;
  return start || end || '';
}

function buildTeamBlocks(day: AnyRecord): TeamBlock[] {
  const blocks: TeamBlock[] = [];
  const crewList = Array.isArray(day?.crewList) ? day.crewList : [];
  const preList = Array.isArray(day?.preList) ? day.preList : [];
  const pickList = Array.isArray(day?.pickList) ? day.pickList : [];
  const refBlocks = Array.isArray(day?.refBlocks) ? day.refBlocks : [];
  const legacyRefList = !refBlocks.length && Array.isArray(day?.refList) ? day.refList : [];

  if (crewList.length > 0) {
    blocks.push({
      label: i18n.t('needs.technicalTeam', { defaultValue: 'Equipo base' }),
      members: getFullListText(crewList),
      schedule: getScheduleForKeys(day, 'crewStart', 'crewEnd'),
      palette: getPaletteForNormalizedDayType(normalizeDayType(day?.crewTipo || day?.tipo || 'rodaje')),
    });
  }

  if (preList.length > 0) {
    blocks.push({
      label: i18n.t('needs.prelight', { defaultValue: 'Prelight' }),
      members: getFullListText(preList),
      schedule: getScheduleForKeys(day, 'preStart', 'preEnd'),
      palette: getPaletteForNormalizedDayType('prelight'),
    });
  }

  if (pickList.length > 0) {
    blocks.push({
      label: i18n.t('needs.pickup', { defaultValue: 'Recogida' }),
      members: getFullListText(pickList),
      schedule: getScheduleForKeys(day, 'pickStart', 'pickEnd'),
      palette: getPaletteForNormalizedDayType('recogida'),
    });
  }

  if (refBlocks.length > 0) {
    refBlocks.forEach((block: AnyRecord, index: number) => {
      const members = Array.isArray(block?.list) ? block.list : [];
      if (members.length === 0 && !stripHtml(block?.tipo) && !stripHtml(block?.text)) return;
      blocks.push({
        label:
          stripHtml(block?.tipo) ||
          `${i18n.t('needs.reinforcements', { defaultValue: 'Equipo extra' })}${refBlocks.length > 1 ? ` ${index + 1}` : ''}`,
        members: getFullListText(members) || stripHtml(block?.text),
        schedule: getRefBlockSchedule(block),
        palette: { fill: [236, 253, 245], stroke: [16, 185, 129], text: [6, 95, 70] },
      });
    });
  } else if (legacyRefList.length > 0) {
    blocks.push({
      label: i18n.t('needs.reinforcements', { defaultValue: 'Equipo extra' }),
      members: getFullListText(legacyRefList),
      schedule: getScheduleForKeys(day, 'refStart', 'refEnd'),
      palette: { fill: [236, 253, 245], stroke: [16, 185, 129], text: [6, 95, 70] },
    });
  }

  return blocks.filter(block => stripHtml(block.members) !== '');
}

function getDayDetail(day: AnyRecord): string {
  const location = stripHtml(day?.loc);
  const sequence = stripHtml(day?.seq);
  if (location && sequence) return shortText(`${location} · ${sequence}`, 26);
  return shortText(location || sequence, 26);
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
    let lastScope = '';
    weeks.forEach((week, index) => {
      const firstDate = week.find((date): date is Date => Boolean(date));
      if (!firstDate) return;
      const weekdayIndex = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1;
      const mondayIso = toYYYYMMDD(addDays(firstDate, -weekdayIndex));
      weekLabels[index] =
        weekLabelByMonday.get(mondayIso) ||
        translateWeekLabel(i18n.t('planning.weekFormat', { number: index + 1 }));
      const scope = byDate.get(toYYYYMMDD(firstDate))?.scope;
      if (!scope || scope === lastScope) return;
      lastScope = scope;
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

function drawWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  options?: {
    align?: 'left' | 'center' | 'right';
    lineHeight?: number;
    maxLines?: number;
  }
) {
  const safe = stripHtml(text);
  if (!safe || maxHeight <= 0) return;
  const align = options?.align || 'left';
  const lineHeight = options?.lineHeight || 2.45;
  const computedMaxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  const maxLines = Math.max(1, Math.min(options?.maxLines || computedMaxLines, computedMaxLines));
  const lines = pdf.splitTextToSize(safe, maxWidth).slice(0, maxLines);
  lines.forEach((line: string, index: number) => {
    pdf.text(line, x, y + index * lineHeight, { align, baseline: 'top', maxWidth });
  });
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

type ProjectInfoItem = {
  label: string;
  value: unknown;
  align?: 'left' | 'right';
};

function buildProjectInfoColumns(project: AnyRecord): {
  left: ProjectInfoItem[];
  right: ProjectInfoItem[];
} {
  const left: ProjectInfoItem[] = [
    { label: `${i18n.t('pdf.production', { defaultValue: 'Producción' })}:`, value: project?.productora || project?.produccion },
    { label: `${i18n.t('pdf.project', { defaultValue: 'Proyecto' })}:`, value: project?.nombre },
    { label: `${i18n.t('pdf.warehouse', { defaultValue: 'Magatzem' })}:`, value: project?.almacen },
    { label: `${i18n.t('pdf.productionManager', { defaultValue: 'Cap de producció' })}:`, value: project?.jefeProduccion },
    { label: `${i18n.t('pdf.transport', { defaultValue: 'Cap de transports' })}:`, value: project?.transportes },
  ].filter(item => stripHtml(item.value));

  const right: ProjectInfoItem[] = [
    { label: `${i18n.t('pdf.dop', { defaultValue: 'DoP' })}:`, value: project?.dop, align: 'right' },
    { label: `${i18n.t('pdf.gaffer', { defaultValue: 'Gaffer' })}:`, value: project?.gaffer, align: 'right' },
    { label: `${i18n.t('pdf.bestBoy', { defaultValue: 'Best boy' })}:`, value: project?.bestBoy, align: 'right' },
    { label: `${i18n.t('pdf.locations', { defaultValue: 'Cap de localitzacions' })}:`, value: project?.localizaciones, align: 'right' },
    { label: `${i18n.t('pdf.productionCoordinator', { defaultValue: 'Coordinadora de producció' })}:`, value: project?.coordinadoraProduccion, align: 'right' },
  ].filter(item => stripHtml(item.value));

  return { left, right };
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
  const projectInfo = buildProjectInfoColumns(project);
  const summaryPaddingTop = 5;
  const summaryPaddingBottom = 4;
  const summaryRowGap = 6;
  const summaryRows = Math.max(projectInfo.left.length, projectInfo.right.length);
  const summaryH =
    summaryRows > 0
      ? summaryPaddingTop + summaryPaddingBottom + (summaryRows - 1) * summaryRowGap + 3.2
      : 0;
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

  if (summaryH > 0) {
    fillRoundedRect(pdf, PAGE.marginX, summaryY, PAGE.width - PAGE.marginX * 2, summaryH, [241, 245, 249], [226, 232, 240], 4);
    const leftX = PAGE.marginX + 5;
    const rightX = PAGE.width - PAGE.marginX - 5;
    const leftW = 120;
    const rightW = 120;
    const firstRowY = summaryY + summaryPaddingTop;

    projectInfo.left.forEach((item, index) => {
      drawInfoItem(pdf, item.label, item.value, leftX, firstRowY + index * summaryRowGap, leftW);
    });

    projectInfo.right.forEach((item, index) => {
      drawInfoItem(
        pdf,
        item.label,
        item.value,
        rightX,
        firstRowY + index * summaryRowGap,
        rightW,
        item.align || 'right'
      );
    });
  }

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

      if (!date) {
        pdf.setFillColor(82, 96, 138);
        pdf.setDrawColor(221, 228, 238);
        pdf.rect(x, headerY, cellW, dayHeaderH, 'FD');
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, bodyY, cellW, bodyHLocal, 'FD');
        return;
      }

      const info = byDate.get(toYYYYMMDD(date));
      const day = info?.day || {};
      const rest = isRestDay(day);
      const schedule = getDaySchedule(day);
      const detail = getDayDetail(day);
      const teamBlocks = buildTeamBlocks(day);
      const weekdayIndex = (date.getDay() + 6) % 7;
      const dayName = i18n.t(DAY_KEYS[weekdayIndex], { defaultValue: DAY_FALLBACKS[weekdayIndex] });
      const typeLabel = getDayTypeLabel(day);
      const typePalette = getDayTypePalette(day);

      pdf.setFillColor(...typePalette.stroke);
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, headerY, cellW, dayHeaderH, 'FD');

      if (getPrimaryDayType(day) === 'descanso' || getPrimaryDayType(day) === 'fin') {
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setTextColor(31, 41, 55);
      }
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

      if (rest) {
        pdf.setFillColor(...typePalette.fill);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.setDrawColor(221, 228, 238);
      pdf.rect(x, bodyY, cellW, bodyHLocal, 'FD');

      const padX = x + 0.9;
      const innerW = cellW - 1.8;
      const gapY = 0.7;
      const bottomPadding = 0.8;
      let currentY = bodyY + 0.9;
      const availableInnerHeight = Math.max(7.2, bodyHLocal - 1.7);
      const baseBandH = availableInnerHeight >= 18 ? 3.6 : availableInnerHeight >= 14 ? 3.2 : 2.8;
      const bandH = Math.max(2.8, Math.min(3.6, baseBandH));

      pdf.setFillColor(...typePalette.fill);
      pdf.setDrawColor(...typePalette.stroke);
      pdf.roundedRect(padX, currentY, innerW, bandH, 0.9, 0.9, 'FD');
      pdf.setTextColor(...typePalette.text);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5.5);
      drawClampedText(pdf, typeLabel, padX + 0.7, currentY + 0.45, innerW - 1.4);

      if (!rest) {
        currentY += bandH + gapY;
        if (schedule) {
          pdf.setFillColor(255, 251, 235);
          pdf.setDrawColor(253, 230, 138);
          pdf.roundedRect(padX, currentY, innerW, bandH, 0.9, 0.9, 'FD');
          pdf.setTextColor(146, 64, 14);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(5.1);
          const scheduleLabel = i18n.t('planning.schedulePrefix', { defaultValue: 'Horario' });
          drawClampedText(pdf, `${scheduleLabel}: ${schedule}`, padX + 0.7, currentY + 0.55, innerW - 1.4);
          currentY += bandH + gapY;
        }

        if (detail) {
          pdf.setFillColor(248, 250, 252);
          pdf.setDrawColor(203, 213, 225);
          pdf.roundedRect(padX, currentY, innerW, bandH, 0.9, 0.9, 'FD');
          pdf.setTextColor(71, 85, 105);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(4.9);
          drawClampedText(pdf, detail, padX + 0.7, currentY + 0.55, innerW - 1.4);
          currentY += bandH + gapY;
        }

        const remainingHeight = Math.max(0, bodyY + bodyHLocal - currentY - bottomPadding);
        const visibleBlocks = teamBlocks.length > 0 ? teamBlocks : [];

        if (visibleBlocks.length > 0 && remainingHeight > 3.5) {
          const teamGap = 0.55;
          const minBlockHeight = 4.2;
          const maxVisibleBlocks = Math.max(
            1,
            Math.min(visibleBlocks.length, Math.floor((remainingHeight + teamGap) / (minBlockHeight + teamGap)))
          );
          const blocksToRender = visibleBlocks.slice(0, maxVisibleBlocks);
          const totalGap = teamGap * Math.max(0, blocksToRender.length - 1);
          const usableHeight = Math.max(0, remainingHeight - totalGap);
          const blockHeight = Math.max(3.6, usableHeight / blocksToRender.length);

          blocksToRender.forEach((block, blockIndex) => {
            const blockY = currentY + blockIndex * (blockHeight + teamGap);
            const safeBlockHeight = Math.max(
              3.4,
              Math.min(blockHeight, bodyY + bodyHLocal - blockY - bottomPadding)
            );
            if (safeBlockHeight <= 0.6) return;

            pdf.setFillColor(...block.palette.fill);
            pdf.setDrawColor(...block.palette.stroke);
            pdf.roundedRect(padX, blockY, innerW, safeBlockHeight, 0.9, 0.9, 'FD');

            const headerText = block.schedule ? `${block.label} · ${block.schedule}` : block.label;
            pdf.setTextColor(...block.palette.text);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(4.8);
            drawClampedText(pdf, headerText, padX + 0.65, blockY + 0.45, innerW - 1.3);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(4.55);
            drawWrappedText(pdf, block.members, padX + 0.65, blockY + 2.65, innerW - 1.3, safeBlockHeight - 3.05, {
              lineHeight: 2.2,
            });
          });
        }
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
