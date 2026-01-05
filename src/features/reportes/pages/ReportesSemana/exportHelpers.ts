import React from 'react';
import { buildReportWeekHTML, exportReportWeekToPDF } from '../../utils/export';
import { dayNameFromISO, toDisplayDate } from '@shared/utils/date';
import { DAY_NAMES, CONCEPTS } from '../../constants';
import { personaKey, personaRole, personaName } from '../../utils/model';
import { Project } from './ReportesSemanaTypes';

export const defaultExportWeek = (
  project: Project | undefined,
  title: string,
  safeSemana: string[],
  dayNameFromISO: (iso: string, index: number) => string,
  horarioTexto: (iso: string) => string,
  data: any
) => {
  const css = `body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111;padding:20px} table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0} th,td{border:1px solid #222;padding:6px;vertical-align:top} thead th{background:#eee}`;
  const inner = buildReportWeekHTML({
    project,
    title,
    safeSemana: [...safeSemana],
    dayNameFromISO,
    toDisplayDate,
    horarioTexto,
    CONCEPTS: [...CONCEPTS],
    data,
    personaKey,
    personaRole,
    personaName,
  });
  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>${project?.nombre || 'Proyecto'} – Reporte</title><style>${css}</style></head><body>${inner}</body></html>`);
    w.document.close();
  }
};

export const handleExportPDF = async (
  project: Project | undefined,
  title: string,
  safeSemana: string[],
  dayNameFromISO: (iso: string, index: number) => string,
  horarioTexto: (iso: string) => string,
  data: any,
  onExportWeekPDF?: () => void,
  defaultExport?: () => void
) => {
  if (typeof onExportWeekPDF === 'function') return onExportWeekPDF();
  const ok = await exportReportWeekToPDF({
    project,
    title,
    safeSemana: [...safeSemana],
    dayNameFromISO,
    toDisplayDate,
    horarioTexto,
    CONCEPTS: [...CONCEPTS],
    data,
    personaKey,
    personaRole,
    personaName,
    orientation: 'landscape',
  });
  if (!ok && defaultExport) defaultExport();
};

