import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { TextAreaAutoProps } from '../types';

/**
 * Convierte HTML <strong> a Markdown **texto**
 */
function htmlStrongToMarkdown(text: string): string {
  if (!text) return text;
  // Convertir <strong>texto</strong> a **texto**
  return text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
}

export function TextAreaAuto({
  value,
  onChange,
  className = '',
  readOnly = false,
}: TextAreaAutoProps) {
  // Convertir cualquier HTML a Markdown al recibir el valor
  const normalizeValue = (val: string | undefined): string => {
    if (!val) return '';
    // Si tiene HTML <strong>, convertir a Markdown
    if (val.includes('<strong>')) {
      return htmlStrongToMarkdown(val);
    }
    return val;
  };

  const [v, setV] = useState<string>(() => normalizeValue(value));
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const normalized = normalizeValue(value);
    setV(normalized);
  }, [value]);

  useEffect(() => {
    if (!textareaRef.current || !isEditing) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }, [v, isEditing]);

  // Detectar si hay Markdown (**texto**)
  // Ya no detectamos HTML porque siempre lo convertimos a Markdown
  const hasMarkdown = /\*\*.*?\*\*/.test(v);
  const hasFormatting = hasMarkdown;

  // Si no hay formato o está editando, mostrar textarea
  if (!hasFormatting || isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={v}
        onChange={e => {
          if (readOnly) return;
          const newValue = e.target.value;
          // Asegurarse de que cualquier HTML se convierta a Markdown antes de guardar
          const normalizedValue = normalizeValue(newValue);
          setV(normalizedValue);
          onChange && onChange(normalizedValue);
        }}
        onBlur={() => {
          if (!readOnly) setIsEditing(false);
        }}
        onFocus={() => {
          if (!readOnly) setIsEditing(true);
        }}
        disabled={readOnly}
        readOnly={readOnly}
        className={`w-full leading-relaxed whitespace-pre-wrap px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg lg:rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-[10px] sm:text-xs md:text-sm transition-colors ${
          readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand/50'
        } ${className}`}
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

  // Renderizar Markdown a HTML
  // Configurar marked para renderizar solo texto inline (sin párrafos)
  marked.setOptions({
    breaks: true, // Convertir \n a <br>
    gfm: true, // GitHub Flavored Markdown
  });

  // Convertir Markdown a HTML para renderizado
  let htmlContent = v;
  if (hasMarkdown) {
    // Renderizar Markdown
    htmlContent = marked.parse(v) as string;
  } else {
    // Si no tiene formato, solo convertir saltos de línea
    htmlContent = htmlContent.replace(/\n/g, '<br>');
  }

  return (
    <div
      ref={displayRef}
      onClick={() => !readOnly && setIsEditing(true)}
      onBlur={() => !readOnly && setIsEditing(false)}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className={`w-full leading-relaxed px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded sm:rounded-md md:rounded-lg lg:rounded-xl bg-neutral-surface border border-neutral-border text-[10px] sm:text-xs md:text-sm transition-colors ${
        readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-text hover:border-brand/50'
      } ${className}`}
      style={{ minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}
    />
  );
}

