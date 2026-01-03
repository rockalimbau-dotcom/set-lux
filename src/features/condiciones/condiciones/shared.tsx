import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/config';
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
    ['{{FACTOR_HORA_EXTRA_FESTIVA}}', params.factorHoraExtraFestiva],
    ['{{DIV_TRAVEL}}', params.divTravel],
    ['{{CORTESIA_MIN}}', params.cortesiaMin],
    ['{{TA_DIARIO}}', params.taDiario],
    ['{{TA_FINDE}}', params.taFinde],
    ['{{NOCTURNO_INI}}', params.nocturnoIni],
    ['{{NOCTURNO_FIN}}', params.nocturnoFin],
    ['{{NOCTURNIDAD_COMPLEMENTO}}', params.nocturnidadComplemento],
    ['{{DIETA_DESAYUNO}}', params.dietaDesayuno],
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
    [params.factorHoraExtraFestiva, '{{FACTOR_HORA_EXTRA_FESTIVA}}'],
    [params.divTravel, '{{DIV_TRAVEL}}'],
    [params.cortesiaMin, '{{CORTESIA_MIN}}'],
    [params.taDiario, '{{TA_DIARIO}}'],
    [params.taFinde, '{{TA_FINDE}}'],
    [params.nocturnoIni, '{{NOCTURNO_INI}}'],
    [params.nocturnoFin, '{{NOCTURNO_FIN}}'],
    [params.nocturnidadComplemento, '{{NOCTURNIDAD_COMPLEMENTO}}'],
    [params.dietaDesayuno, '{{DIETA_DESAYUNO}}'],
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

// ------ Helper para restaurar tags <strong> en textos ------
export function restoreStrongTags(text: string): string {
  if (!text) return text;
  
  // Si ya tiene tags, normalizar "Turn around" y "Nocturnidades" a minúsculas
  if (text.includes('<strong>')) {
    let result = text;
    result = result.replace(/<strong>(TURN AROUND:)/gi, '<strong>Turn around:');
    result = result.replace(/<strong>(NOCTURNIDADES:)/gi, '<strong>Nocturnidad:');
    result = result.replace(/(TURN AROUND:)/gi, 'Turn around:');
    result = result.replace(/(NOCTURNIDADES:)/gi, 'Nocturnidad:');
    return result;
  }
  
  // Primero normalizar mayúsculas/minúsculas
  let normalized = text;
  normalized = normalized.replace(/TURN AROUND:/gi, 'Turn around:');
  normalized = normalized.replace(/NOCTURNIDADES:/gi, 'Nocturnidad:');
  
  // Patrones comunes que deberían estar en negrita
  const patterns: Array<[RegExp, string]> = [
    [/^(Tarifa mensual:)/m, '<strong>$1</strong>'],
    [/^(Tarifa semanal:)/m, '<strong>$1</strong>'],
    [/^(Precio diario:)/m, '<strong>$1</strong>'],
    [/^(Precio jornada:)/m, '<strong>$1</strong>'],
    [/^(Precio refuerzo:)/m, '<strong>$1</strong>'],
    [/^(Precio Día extra \/ Festivo:)/m, '<strong>$1</strong>'],
    [/^(Precio Travel Day:)/m, '<strong>$1</strong>'],
    [/^(Horas extras:)/m, '<strong>$1</strong>'],
    [/^(Turn around:)/m, '<strong>$1</strong>'],
    [/^(Nocturnidad:)/m, '<strong>$1</strong>'],
    [/^(Comida:)/m, '<strong>$1</strong>'],
    [/^(Cena:)/m, '<strong>$1</strong>'],
    [/^(Dieta completa sin pernocta:)/m, '<strong>$1</strong>'],
    [/^(Dieta completa y desayuno:)/m, '<strong>$1</strong>'],
    [/^(Gastos de bolsillo:)/m, '<strong>$1</strong>'],
    [/^(Gastos de Bolsillo:)/m, '<strong>Gastos de bolsillo:</strong>'],
  ];
  
  let result = normalized;
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
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
        <th style="border:1px solid #999;padding:6px;text-align:left;background:#0476D9;color:#fff;">Rol / Precio</th>
        ${PRICE_HEADERS.map(
          h =>
            `<th style="border:1px solid #999;padding:6px;text-align:left;background:#0476D9;color:#fff;">${esc(
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
      <h4 style="margin:0 0 6px 0;color:#0476D9;font-weight:700;">${esc(
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
  readOnly?: boolean;
}

export function TextAreaAuto({ value, onChange, className = '', readOnly = false }: TextAreaAutoProps) {
  const [v, setV] = useState<string>(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setV(value || ''), [value]);

  useEffect(() => {
    if (!textareaRef.current || !isEditing) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }, [v, isEditing]);

  // Si hay HTML tags en el valor, mostrar renderizado; si no, mostrar textarea normal
  const hasHTML = /<[^>]+>/.test(v);

  // Si no hay HTML o está editando, mostrar textarea
  if (!hasHTML || isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={v}
        onChange={e => {
          if (readOnly) return;
          setV(e.target.value);
          onChange && onChange(e.target.value);
        }}
        onBlur={() => {
          if (!readOnly) setIsEditing(false);
        }}
        onFocus={() => {
          if (!readOnly) setIsEditing(true);
        }}
        disabled={readOnly}
        readOnly={readOnly}
        className={`w-full leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand/50'} ${className}`}
        style={{ height: 'auto', overflow: 'hidden', resize: 'none' }}
        rows={1}
        onInput={e => {
          if (readOnly) return;
          const t = e.target as HTMLTextAreaElement;
          t.style.height = 'auto';
          t.style.height = t.scrollHeight + 'px';
        }}
      />
    );
  }

  // Mostrar HTML renderizado
  // Convertir saltos de línea a <br> para preservar el formato
  // Primero procesar el HTML, luego convertir los saltos de línea restantes
  let htmlWithBreaks = v;
  // Si hay tags HTML, preservar los saltos de línea convirtiéndolos a <br>
  // pero solo los que no están dentro de tags
  htmlWithBreaks = htmlWithBreaks.replace(/\n/g, '<br>');
  
  return (
    <div
      ref={displayRef}
      onClick={() => !readOnly && setIsEditing(true)}
      onBlur={() => !readOnly && setIsEditing(false)}
      dangerouslySetInnerHTML={{ __html: htmlWithBreaks }}
      className={`w-full leading-relaxed px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border text-sm transition-colors ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-text hover:border-brand/50'} ${className}`}
      style={{ minHeight: '56px', whiteSpace: 'pre-wrap' }}
    />
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  onChange?: (val: string) => void;
  rightAddon?: React.ReactNode;
  readOnly?: boolean;
  template?: string;
  defaultTemplate?: string;
  params?: Record<string, any>;
  translationKey?: string;
  onRestore?: () => void;
}

export function InfoCard({ 
  title, 
  value, 
  onChange, 
  rightAddon = null, 
  readOnly = false,
  template,
  defaultTemplate,
  params = {},
  translationKey,
  onRestore
}: InfoCardProps) {
  const { t, i18n } = useTranslation();
  
  // Función para normalizar texto
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').replace(/\n+/g, '\n');
  };
  
  // Detectar si el texto está modificado (no es default) - usando useMemo para recalcular cuando cambia template o idioma
  const modified = useMemo(() => {
    if (!template || template.trim() === '' || !translationKey) return false;
    
    const languages = ['es', 'en', 'ca'];
    const currentLanguage = i18n.language;
    
    // Primero comparar el template directamente (sin renderizar) con los defaults
    const normalizedTemplate = normalizeText(template);
    const templateMatchesDirectly = languages.some(lang => {
      try {
        const defaultText = i18n.t(translationKey, { lng: lang });
        const normalizedDefault = normalizeText(defaultText);
        
        // Comparación exacta del template
        if (normalizedTemplate === normalizedDefault) return true;
        
        // Comparación de estructura (reemplazando variables)
        if (template.includes('{{') && template.includes('}}')) {
          const templateStructure = normalizedTemplate.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
          const defaultStructure = normalizedDefault.replace(/\{\{[^}]+\}\}/g, '{{VAR}}');
          if (templateStructure === defaultStructure) return true;
        }
        
        return false;
      } catch {
        return false;
      }
    });
    
    if (templateMatchesDirectly) return false;
    
    // Si no coincide directamente, comparar los renderizados
    const currentRendered = renderWithParams(template, params);
    const normalizedCurrent = normalizeText(currentRendered);
    
    const matchesAnyDefault = languages.some(lang => {
      try {
        const defaultText = i18n.t(translationKey, { lng: lang });
        const defaultRendered = renderWithParams(defaultText, params);
        const normalizedDefault = normalizeText(defaultRendered);
        
        if (normalizedCurrent === normalizedDefault) return true;
        
        return false;
      } catch {
        return false;
      }
    });
    
    return !matchesAnyDefault;
  }, [template, translationKey, params, i18n.language]);
  
  const showRestoreButton = modified && !readOnly && onRestore;
  
  return (
    <section className={`rounded-2xl border border-neutral-border bg-neutral-panel/90 p-4 transition-colors ${readOnly ? '' : 'hover:border-brand/50'}`}>
      <div className='flex items-center justify-between mb-2'>
        <h4 className='text-brand font-semibold'>{title}</h4>
        <div className='flex items-center gap-2'>
          {rightAddon}
        </div>
      </div>
      <TextAreaAuto
        value={value}
        onChange={onChange}
        className='min-h-[140px]'
        readOnly={readOnly}
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
  type?: 'number' | 'time' | 'text';
  readOnly?: boolean;
}

export function ParamInput({ label, value, onChange, suffix, duo, type, readOnly = false }: ParamInputProps) {
  // Determinar el tipo de input: si es nocturno usa 'time', si no se especifica usa 'number' por defecto
  const inputType = type || (label.toLowerCase().includes('nocturno') ? 'time' : 'number');
  
  if (duo && Array.isArray(duo) && duo.length === 2) {
    return (
      <label className='space-y-1'>
        <span className='block text-sm text-zinc-300'>{label}</span>
        <div className='flex items-center gap-2'>
          <input
            type={inputType}
            className={`w-full px-3 py-2 rounded-lg dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-sm text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={duo[0].value}
            onChange={e => !readOnly && duo[0].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            placeholder=''
          />
          <span className='text-zinc-400'>+</span>
          <input
            type={inputType}
            className={`w-full px-3 py-2 rounded-lg dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-sm text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={duo[1].value}
            onChange={e => !readOnly && duo[1].onChange(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
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
          type={inputType}
          className={`w-full px-3 py-2 rounded-lg dark:bg-transparent border border-neutral-border focus:outline-none focus:ring-1 text-sm text-right ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={value || ''}
          onChange={e => !readOnly && onChange && onChange(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
          placeholder=''
        />
        {suffix && <span className='text-zinc-400 text-sm'>{suffix}</span>}
      </div>
    </label>
  );
}


