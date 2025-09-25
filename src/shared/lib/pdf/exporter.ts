// src/lib/pdf/exporter.ts
import html2pdf from 'html2pdf.js';

export interface PDFOptions {
  filename?: string;
  title?: string;
  margin?: number;
  landscape?: boolean;
  format?: string;
  scale?: number;
  backgroundColor?: string;
  applyPdfMode?: boolean;
}

export async function elementOnScreenToPDF(selector: string | Element, opts: PDFOptions = {}) {
  const el =
    typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) throw new Error('elementOnScreenToPDF: selector no encontrado');

  const {
    filename = 'export.pdf',
    title,
    margin = 10,
    landscape = true,
    format = 'a4',
    scale = 2,
    backgroundColor = '#ffffff',
    applyPdfMode = false,
  } = opts;

  const opt = {
    margin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale, useCORS: true, backgroundColor }, // 👈 importante
    pagebreak: { mode: ['css', 'legacy'] },
    jsPDF: {
      unit: 'mm',
      format,
      orientation: landscape ? 'landscape' : 'portrait',
    },
  };

  try {
    if (applyPdfMode) document.documentElement.classList.add('pdf-mode');
    if (title) document.title = title;
    await html2pdf().set(opt).from(el).save();
  } finally {
    if (applyPdfMode) document.documentElement.classList.remove('pdf-mode');
  }
}
