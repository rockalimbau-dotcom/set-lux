import React, { useEffect, useRef, useState } from 'react';
import { TextAreaAutoProps } from '../types';

export function TextAreaAuto({
  value,
  onChange,
  className = '',
  readOnly = false,
}: TextAreaAutoProps) {
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
        className={`w-full leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm transition-colors ${
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

  // Mostrar HTML renderizado
  // Convertir saltos de línea a <br> para preservar el formato
  let htmlWithBreaks = v;
  htmlWithBreaks = htmlWithBreaks.replace(/\n/g, '<br>');

  return (
    <div
      ref={displayRef}
      onClick={() => !readOnly && setIsEditing(true)}
      onBlur={() => !readOnly && setIsEditing(false)}
      dangerouslySetInnerHTML={{ __html: htmlWithBreaks }}
      className={`w-full leading-relaxed px-3 py-2 rounded-xl bg-neutral-surface border border-neutral-border text-sm transition-colors ${
        readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-text hover:border-brand/50'
      } ${className}`}
      style={{ minHeight: '56px', whiteSpace: 'pre-wrap' }}
    />
  );
}

