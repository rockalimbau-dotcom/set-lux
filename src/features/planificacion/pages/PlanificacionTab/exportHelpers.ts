import { parseYYYYMMDD, addDays } from '@shared/utils/date';
import { DAYS } from '../../constants';
import { renderExportHTML } from '../../utils/export';
import { exportToPDF, exportAllToPDF } from '../../utils/exportPDF';
import { AnyRecord } from '@shared/types/common';

export const openHtmlInNewTab = (title: string, innerHtml: string) => {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (!w) return;
  try {
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${title}</title></head><body>${innerHtml}</body></html>`);
    w.document.close();
  } catch {}
};

const exportCSS = `.export-doc{font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;} .export-doc h2{margin:12px 0 8px;font-size:18px} .export-doc .wk{break-after:page;page-break-after:always;} .export-doc .wk:last-child{break-after:auto;page-break-after:auto;} .export-doc table{width:100%;border-collapse:collapse} .export-doc th,.export-doc td{border:1px solid #222;padding:6px;vertical-align:top} .export-doc thead th{background:#eee}`;

export const exportScope = async (
  scope: 'pre' | 'pro' | 'all',
  preWeeks: AnyRecord[],
  proWeeks: AnyRecord[],
  project: AnyRecord | undefined
) => {
  const weeks =
    scope === 'pre'
      ? preWeeks
      : scope === 'pro'
        ? proWeeks
        : [...preWeeks, ...proWeeks];
  const body = `<style>${exportCSS}</style>` + renderExportHTML(
    ((project as AnyRecord)?.nombre || 'Proyecto') as string,
    weeks as any,
    [...DAYS] as any,
    parseYYYYMMDD,
    addDays
  );
  openHtmlInNewTab(`${((project as AnyRecord)?.nombre || 'Proyecto') as string} – Planificación`, body);
};

export const exportWeek = async (
  week: AnyRecord,
  project: AnyRecord | undefined
) => {
  const body = `<style>${exportCSS}</style>` + renderExportHTML(
    ((project as AnyRecord)?.nombre || 'Proyecto') as string,
    [week] as any,
    [...DAYS] as any,
    parseYYYYMMDD,
    addDays
  );
  openHtmlInNewTab(`${((project as AnyRecord)?.nombre || 'Proyecto') as string} – ${week.label}`, body);
};

export const exportWeekPDF = async (
  week: AnyRecord,
  project: AnyRecord | undefined
) => {
  try {
    await exportToPDF(
      project,
      [week] as any,
      [...DAYS] as any,
      parseYYYYMMDD,
      addDays
    );
  } catch (error) {
    console.error('Error exporting week PDF:', error);
  }
};

export const exportScopePDF = async (
  scope: 'pre' | 'pro' | 'all',
  preWeeks: AnyRecord[],
  proWeeks: AnyRecord[],
  project: AnyRecord | undefined
) => {
  try {
    let weeksToExport: AnyRecord[] = [];
    
    if (scope === 'pre') {
      weeksToExport = preWeeks;
    } else if (scope === 'pro') {
      weeksToExport = proWeeks;
    } else {
      weeksToExport = [...preWeeks, ...proWeeks];
    }

    if (weeksToExport.length === 0) {
      console.log(`No weeks to export for scope: ${scope}`);
      return;
    }

    await exportAllToPDF(
      project,
      weeksToExport as any,
      [...DAYS] as any,
      parseYYYYMMDD,
      addDays,
      scope === 'all' ? undefined : scope
    );
  } catch (error) {
    console.error('Error exporting scope PDF:', error);
  }
};

