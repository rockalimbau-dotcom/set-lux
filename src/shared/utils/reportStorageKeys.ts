import { storage } from '../services/localStorage.service';

export type ReportProjectRef = { id?: string; nombre?: string } | null | undefined;

/** Misma prioridad que Reportes / useReportStorageKeys: id gana sobre nombre. */
export function primaryReportStorageBase(project: ReportProjectRef): string {
  const id = String(project?.id ?? '').trim();
  const nombre = String(project?.nombre ?? '').trim();
  return id || nombre || 'tmp';
}

/**
 * Bases a probar al leer datos de reporte desde localStorage.
 * Si existen id y nombre distintos, los datos pueden haberse guardado solo con uno
 * (p. ej. proyecto sin id al principio o distinta pantalla pasando otro campo).
 */
export function reportStorageBaseCandidates(project: ReportProjectRef): string[] {
  const id = String(project?.id ?? '').trim();
  const nombre = String(project?.nombre ?? '').trim();
  const primary = id || nombre || 'tmp';
  const out: string[] = [primary];
  if (id && nombre && id !== nombre) {
    const secondary = primary === id ? nombre : id;
    if (!out.includes(secondary)) out.push(secondary);
  }
  return out;
}

/**
 * Lee el JSON de una semana de reportes con la misma convención de clave que ReportesSemana.
 * Si la clave canónica no existe, intenta la base alternativa (id ↔ nombre).
 * Si la clave canónica existe (incluso `{}`), se respeta y no se cruza con el legado.
 */
export function getReportWeekStoredJSON(project: ReportProjectRef, isoDays: string[]): Record<string, unknown> {
  const suffix = isoDays.join('_');
  for (const base of reportStorageBaseCandidates(project)) {
    const key = `reportes_${base}_${suffix}`;
    if (!storage.has(key)) continue;
    try {
      const obj = storage.getJSON<Record<string, unknown>>(key);
      if (obj && typeof obj === 'object') return obj;
    } catch {
      /* ignore */
    }
  }
  return {};
}
