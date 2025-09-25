import React, { useEffect, useRef, useState } from 'react';
import { storage } from '@shared/services/localStorage.service';
import { PRICE_HEADERS, PRICE_ROLES } from './shared.constants';

// Reutilizable: extrae fechas tipo 1/01, 01-04, 1/01/2025, etc.
export function extractFestivosDatesForPlan(text: unknown): string[] {
  const src = String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[–—−]/g, '-');

  const out: string[] = [];
  const re = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const d = String(m[1]).padStart(2, '0');
    const mo = String(m[2]).padStart(2, '0');
    const yRaw = m[3];
    if (yRaw) {
      const y = String(yRaw).length === 2 ? `20${yRaw}` : String(yRaw);
      out.push(`${d}/${mo}/${y}`); // DD/MM/YYYY
    } else {
      out.push(`${d}/${mo}`); // DD/MM
    }
  }
  return Array.from(new Set(out));
}

// ------ Helpers de marcadores ------
export function renderWithParams(
  tpl: string,
  params: Record<string, any> = {}
): string {
  if (!tpl) return '';
  const map: Array<[string, any]> = [
    ['{{SEMANAS_MES}}', params.semanasMes],
    ['{{DIAS_DIARIO}}', params.diasDiario],
    ['{{DIAS_JORNADA}}', params.diasJornada],
    ['{{JORNADA_TRABAJO}}', params.jornadaTrabajo],
    ['{{JORNADA_COMIDA}}', params.jornadaComida],
    ['{{HORAS_SEMANA}}', params.horasSemana],
    ['{{FACTOR_FESTIVO}}', params.factorFestivo],
    ['{{FACTOR_HORA_EXTRA}}', params.factorHoraExtra],
    ['{{DIV_TRAVEL}}', params.divTravel],
    ['{{CORTESIA_MIN}}', params.cortesiaMin],
    ['{{TA_DIARIO}}', params.taDiario],
    ['{{TA_FINDE}}', params.taFinde],
    ['{{NOCTURNO_INI}}', params.nocturnoIni],
    ['{{NOCTURNO_FIN}}', params.nocturnoFin],
    ['{{DIETA_COMIDA}}', params.dietaComida],
    ['{{DIETA_CENA}}', params.dietaCena],
    ['{{DIETA_SIN_PERNOCTA}}', params.dietaSinPernocta],
    ['{{DIETA_ALOJ_DES}}', params.dietaAlojDes],
    ['{{GASTOS_BOLSILLO}}', params.gastosBolsillo],
    ['{{KM_EURO}}', params.kilometrajeKm],
    ['{{TRANSPORTE_DIA}}', params.transporteDia],
  ];
  for (const [marker, val] of map) tpl = tpl.split(marker).join(String(val ?? ''));
  return tpl;
}

export function visibleToTemplate(
  visible: string,
  params: Record<string, any> = {}
): string {
  if (!visible) return '';
  let tpl = visible;
  const pairs: Array<[any, string]> = [
    [params.semanasMes, '{{SEMANAS_MES}}'],
    [params.diasDiario, '{{DIAS_DIARIO}}'],
    [params.diasJornada, '{{DIAS_JORNADA}}'],
    [params.jornadaTrabajo, '{{JORNADA_TRABAJO}}'],
    [params.jornadaComida, '{{JORNADA_COMIDA}}'],
    [params.horasSemana, '{{HORAS_SEMANA}}'],
    [params.factorFestivo, '{{FACTOR_FESTIVO}}'],
    [params.factorHoraExtra, '{{FACTOR_HORA_EXTRA}}'],
    [params.divTravel, '{{DIV_TRAVEL}}'],
    [params.cortesiaMin, '{{CORTESIA_MIN}}'],
    [params.taDiario, '{{TA_DIARIO}}'],
    [params.taFinde, '{{TA_FINDE}}'],
    [params.nocturnoIni, '{{NOCTURNO_INI}}'],
    [params.nocturnoFin, '{{NOCTURNO_FIN}}'],
    [params.dietaComida, '{{DIETA_COMIDA}}'],
    [params.dietaCena, '{{DIETA_CENA}}'],
    [params.dietaSinPernocta, '{{DIETA_SIN_PERNOCTA}}'],
    [params.dietaAlojDes, '{{DIETA_ALOJ_DES}}'],
    [params.gastosBolsillo, '{{GASTOS_BOLSILLO}}'],
    [params.kilometrajeKm, '{{KM_EURO}}'],
    [params.transporteDia, '{{TRANSPORTE_DIA}}'],
  ];
  for (const [val, marker] of pairs) {
    if (val == null || val === '') continue;
    const escaped = String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    tpl = tpl.replace(new RegExp(`\\b${escaped}\\b`, 'g'), marker);
  }
  return tpl;
}

// ------ Export helper (HTML) ------
export function renderExportHTML(projectName: string, which: string, model: any) {
  const esc = (s: unknown) =>
    String(s ?? '').replace(
      /[&<>]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as const)[c as '&' | '<' | '>']
    );

  const table = `
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0;">
    <thead>
      <tr>
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">Rol / Precio</th>
        ${PRICE_HEADERS.map(
          h =>
            `<th style="border:1px solid #999;padding:6px;text-align:left;background:#1D4ED8;color:#fff;">${esc(
              h
            )}</th>`
        ).join('')}
      </tr>
    </thead>
    <tbody>
      ${PRICE_ROLES.map(
        role => `
        <tr>
          <td style="border:1px solid #999;padding:6px;font-weight:600;">${esc(
            role
          )}</td>
          ${PRICE_HEADERS.map(
            h =>
              `<td style="border:1px solid #999;padding:6px;">${esc(
                model.prices?.[role]?.[h] ?? ''
              )}</td>`
          ).join('')}
        </tr>
      `
      ).join('')}
    </tbody>
  </table>`;

  const blocks = [
    ['Leyenda cálculos', model.legendRendered || ''],
    ['Festivos', model.festivos],
    ['Horarios', model.horarios],
    ['Dietas', model.dietas],
    ['Transportes', model.transportes],
    ['Alojamiento', model.alojamiento],
    ['Pre producción', model.prepro],
    ['Convenio', model.convenio],
  ]
    .map(
      ([title, txt]) => `
    <section style="margin:14px 0;">
      <h4 style="margin:0 0 6px 0;color:#1D4ED8;font-weight:700;">${esc(
        title
      )}</h4>
      <pre style="white-space:pre-wrap;margin:0;font-family:inherit;line-height:1.4;">${esc(
        txt
      )}</pre>
    </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(
    projectName
  )} – Condiciones (${esc(which)})</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:20px;color:#111;">
  <h2 style="margin:0 0 10px 0;">${esc(projectName)} – Condiciones (${esc(
    which
  )})</h2>
  ${table}
  ${blocks}
  <footer style="margin-top:30px;font-size:10px;color:#888;">Generado con SetLux</footer>
</body></html>`;
}

// ------ Persistencia simple ------
export const loadJSON = (k: string, fallback: any) => {
  try {
    const obj = storage.getJSON<any>(k);
    return obj ?? fallback;
  } catch {
    return fallback;
  }
};
export const saveJSON = (k: string, v: any) => {
  try {
    storage.setJSON(k, v);
  } catch {}
};

// ------ Componentes compartidos (misma estética) ------
// Th, Td, Row ahora se importan desde @shared/components

interface TextAreaAutoProps {
  value: string;
  onChange?: (val: string) => void;
  className?: string;
}

export function TextAreaAuto({ value, onChange, className = '' }: TextAreaAutoProps) {
  const [v, setV] = useState<string>(value || '');
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => setV(value || ''), [value]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  }, [v]);

  return (
    <textarea
      ref={ref}
      value={v}
      onChange={e => {
        setV(e.target.value);
        onChange && onChange(e.target.value);
      }}
      className={`w-full leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm ${className}`}
      style={{ height: 'auto', overflow: 'hidden', resize: 'none' }}
      rows={1}
      onInput={e => {
        const t = e.target as HTMLTextAreaElement;
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
      }}
    />
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  onChange?: (val: string) => void;
  rightAddon?: React.ReactNode;
}

export function InfoCard({ title, value, onChange, rightAddon = null }: InfoCardProps) {
  return (
    <section className='rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4'>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-brand font-semibold'>{title}</h4>
        {rightAddon}
      </div>
      <TextAreaAuto
        value={value}
        onChange={onChange}
        className='min-h-[140px]'
      />
    </section>
  );
}

interface DuoField {
  value: string;
  onChange: (val: string) => void;
}

interface ParamInputProps {
  label: string;
  value?: string;
  onChange?: (val: string) => void;
  suffix?: string;
  duo?: [DuoField, DuoField];
}

export function ParamInput({ label, value, onChange, suffix, duo }: ParamInputProps) {
  if (duo && Array.isArray(duo) && duo.length === 2) {
    return (
      <label className='space-y-1'>
        <span className='block text-sm text-zinc-300'>{label}</span>
        <div className='flex items-center gap-2'>
          <input
            className='w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
            value={duo[0].value}
            onChange={e => duo[0].onChange(e.target.value)}
            placeholder=''
          />
          <span className='text-zinc-400'>+</span>
          <input
            className='w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
            value={duo[1].value}
            onChange={e => duo[1].onChange(e.target.value)}
            placeholder=''
          />
          {suffix && <span className='text-zinc-400 text-sm'>{suffix}</span>}
        </div>
      </label>
    );
  }

  return (
    <label className='space-y-1'>
      <span className='block text-sm text-zinc-300'>{label}</span>
      <div className='flex items-center gap-2'>
        <input
          className='w-full px-3 py-2 rounded-lg bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm'
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          placeholder=''
        />
        {suffix && <span className='text-zinc-400 text-sm'>{suffix}</span>}
      </div>
    </label>
  );
}


