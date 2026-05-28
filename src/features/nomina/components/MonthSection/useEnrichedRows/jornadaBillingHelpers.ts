/**
 * Cálculo de importe de jornadas alineado con el desglose visible (píldoras).
 * Excluye tipos con columna propia: sexto día, travel, festivo, 1/2 jornada.
 */

export interface WorkedBreakdownSlice {
  rodaje?: number;
  pruebasCamara?: number;
  oficina?: number;
  prelight?: number;
  recogida?: number;
  carga?: number;
  descarga?: number;
  localizar?: number;
  sextoDia?: number;
  sextoDiaHalf?: number;
}

export interface PriceSegment {
  segmentKey: string;
  roleForPriceLookup: string;
  roleId?: string | null;
  roleLabel?: string | null;
  breakdown: WorkedBreakdownSlice;
  effectivePr: Record<string, unknown>;
  isRefuerzo?: boolean;
  /** Fallback cuando el desglose no detalla tipos pero workedDays > 0 */
  workedDaysFallback?: number;
}

export function sumSemanalJornadaBillableDays(breakdown: WorkedBreakdownSlice): number {
  return (
    (breakdown.rodaje || 0) +
    (breakdown.pruebasCamara || 0) +
    (breakdown.oficina || 0) +
    (breakdown.prelight || 0) +
    (breakdown.recogida || 0) +
    (breakdown.carga || 0) +
    (breakdown.descarga || 0) +
    (breakdown.localizar || 0)
  );
}

/** Días facturables en columna jornada; usa desglose o, si viene vacío, workedDays sin sexto. */
export function resolveSemanalJornadaBillableDays(
  breakdown: WorkedBreakdownSlice,
  workedDays: number,
  sextoDiaDays = 0,
  sextoDiaHalfDays = 0
): number {
  const fromBreakdown = sumSemanalJornadaBillableDays(breakdown);
  if (fromBreakdown > 0) return fromBreakdown;
  return Math.max(0, workedDays - sextoDiaDays - sextoDiaHalfDays);
}

export function buildPriceSegmentKey(roleId?: string | null, roleCode?: string): string {
  const id = String(roleId || '').trim();
  if (id) return id;
  return String(roleCode || '')
    .trim()
    .toUpperCase();
}

function addBreakdownSlices(a: WorkedBreakdownSlice, b: WorkedBreakdownSlice): WorkedBreakdownSlice {
  return {
    rodaje: (a.rodaje || 0) + (b.rodaje || 0),
    pruebasCamara: (a.pruebasCamara || 0) + (b.pruebasCamara || 0),
    oficina: (a.oficina || 0) + (b.oficina || 0),
    prelight: (a.prelight || 0) + (b.prelight || 0),
    recogida: (a.recogida || 0) + (b.recogida || 0),
    carga: (a.carga || 0) + (b.carga || 0),
    descarga: (a.descarga || 0) + (b.descarga || 0),
    localizar: (a.localizar || 0) + (b.localizar || 0),
    sextoDia: (a.sextoDia || 0) + (b.sextoDia || 0),
    sextoDiaHalf: (a.sextoDiaHalf || 0) + (b.sextoDiaHalf || 0),
  };
}

export function mergePriceSegments(existing: PriceSegment[], incoming: PriceSegment[]): PriceSegment[] {
  const map = new Map<string, PriceSegment>();

  for (const seg of [...existing, ...incoming]) {
    const prev = map.get(seg.segmentKey);
    if (!prev) {
      map.set(seg.segmentKey, {
        ...seg,
        breakdown: { ...seg.breakdown },
      });
      continue;
    }
    prev.breakdown = addBreakdownSlices(prev.breakdown, seg.breakdown);
    prev.workedDaysFallback = (prev.workedDaysFallback || 0) + (seg.workedDaysFallback || 0);
    if (sumSemanalJornadaBillableDays(seg.breakdown) > sumSemanalJornadaBillableDays(prev.breakdown)) {
      prev.effectivePr = seg.effectivePr;
      prev.roleForPriceLookup = seg.roleForPriceLookup;
      prev.roleLabel = seg.roleLabel;
    }
  }

  return Array.from(map.values());
}

export function pickPrimaryPriceSegment(segments: PriceSegment[]): PriceSegment | null {
  if (!segments.length) return null;
  return segments.reduce((best, seg) => {
    const bestDays = sumSemanalJornadaBillableDays(best.breakdown);
    const segDays = sumSemanalJornadaBillableDays(seg.breakdown);
    return segDays > bestDays ? seg : best;
  });
}

export function calculateSegmentJornadaEuro(segment: PriceSegment): number {
  const days = resolveSemanalJornadaBillableDays(
    segment.breakdown,
    segment.workedDaysFallback || 0,
    segment.breakdown.sextoDia || 0,
    segment.breakdown.sextoDiaHalf || 0
  );
  const jornada = Number(segment.effectivePr?.jornada || 0);
  return days * jornada;
}

export function calculateSegmentSextoDiaEuro(segment: PriceSegment): number {
  return (segment.breakdown.sextoDia || 0) * Number(segment.effectivePr?.sextoDia || 0);
}

export function calculateSegmentSextoDiaHalfEuro(segment: PriceSegment): number {
  return (segment.breakdown.sextoDiaHalf || 0) * Number(segment.effectivePr?.sextoDiaHalf || 0);
}

export function sumSegmentsJornadaEuro(segments: PriceSegment[]): number {
  return segments.reduce((sum, seg) => sum + calculateSegmentJornadaEuro(seg), 0);
}

export function sumSegmentsSextoDiaEuro(segments: PriceSegment[]): number {
  return segments.reduce((sum, seg) => sum + calculateSegmentSextoDiaEuro(seg), 0);
}

export function sumSegmentsSextoDiaHalfEuro(segments: PriceSegment[]): number {
  return segments.reduce((sum, seg) => sum + calculateSegmentSextoDiaHalfEuro(seg), 0);
}

export function sumSegmentsBillableDays(segments: PriceSegment[]): number {
  return segments.reduce(
    (sum, seg) =>
      sum +
      resolveSemanalJornadaBillableDays(
        seg.breakdown,
        seg.workedDaysFallback || 0,
        seg.breakdown.sextoDia || 0,
        seg.breakdown.sextoDiaHalf || 0
      ),
    0
  );
}

/** Recalcula importes de jornada/sexto y bruto tras fusionar filas de la misma persona. */
export function recalculateMergedRowTotals(
  row: Record<string, unknown>,
  projectMode: 'semanal' | 'mensual' | 'diario'
): void {
  const segments = (row._priceSegments as PriceSegment[] | undefined) || [];
  if (projectMode !== 'semanal' || segments.length === 0) return;

  const primary = pickPrimaryPriceSegment(segments);
  const primaryPr = (primary?.effectivePr || row._pr || {}) as Record<string, unknown>;

  row._totalDias = sumSegmentsJornadaEuro(segments);
  row._totalSextoDia = sumSegmentsSextoDiaEuro(segments);
  row._totalSextoDiaHalf = sumSegmentsSextoDiaHalfEuro(segments);

  const halfDays = Number(row._halfDays || 0);
  const travelDays = Number(row._travel || 0);
  const holidayDays = Number(row._holidays || 0);
  const horasExtra = Number(row.horasExtra || 0);
  const turnAround = Number(row.turnAround || 0);
  const nocturnidad = Number(row.nocturnidad || 0);
  const penaltyLunch = Number(row.penaltyLunch || 0);
  const transporte = Number(row.transporte || 0);
  const km = Number(row.km || 0);
  const gasolina = Number(row.gasolina || 0);
  const totalDietas = Number(row._totalDietas || 0);

  row._totalHalfDays = halfDays * Number(primaryPr.halfJornada || 0);
  row._totalTravel = travelDays * Number(primaryPr.travelDay || 0);
  row._totalHolidays = holidayDays * Number(primaryPr.holidayDay || 0);
  row._totalExtras =
    (horasExtra + turnAround + nocturnidad + penaltyLunch) * Number(primaryPr.horaExtra || 0);
  row._totalTrans = transporte * Number(primaryPr.transporte || 0);
  row._totalKm = km * Number(primaryPr.km || 0);
  row._totalGasolina = gasolina;

  const materialPropioType = String(row._materialPropioType || 'semanal');
  const materialPropioValue = Number(primaryPr.materialPropioValue || 0);
  const materialPropioCount =
    materialPropioType === 'unico'
      ? Number(row._materialPropioUnique || 0)
      : materialPropioType === 'semanal'
      ? Number(row._materialPropioWeeks || 0)
      : Number(row._materialPropioDays || 0);
  row._totalMaterialPropio = materialPropioCount * materialPropioValue;

  row._worked = sumSegmentsBillableDays(segments);
  row._pr = primaryPr;

  row._totalBruto =
    Number(row._totalDias || 0) +
    Number(row._totalHalfDays || 0) +
    Number(row._totalTravel || 0) +
    Number(row._totalHolidays || 0) +
    Number(row._totalSextoDia || 0) +
    Number(row._totalSextoDiaHalf || 0) +
    Number(row._totalExtras || 0) +
    totalDietas +
    Number(row._totalTrans || 0) +
    Number(row._totalKm || 0) +
    Number(row._totalGasolina || 0) +
    Number(row._totalMaterialPropio || 0);
}
