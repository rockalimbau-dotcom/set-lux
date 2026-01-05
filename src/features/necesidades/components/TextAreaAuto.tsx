import React, { useEffect, useRef, useState } from 'react';

type TextAreaAutoProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

export default function TextAreaAuto({ value, onChange, placeholder, readOnly = false }: TextAreaAutoProps) {
  const [v, setV] = useState<string>(value || '');
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  useEffect(() => setV(value || ''), [value]);
  
  const adjustHeight = () => {
    if (!ref.current) return;
    // Usar requestAnimationFrame para evitar reflows forzados
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.height = '0px';
      const scrollHeight = ref.current.scrollHeight;
      ref.current.style.height = scrollHeight + 'px';
      rafRef.current = null;
    });
  };
  
  useEffect(() => {
    adjustHeight();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [v]);
  
  return (
    <textarea
      ref={ref}
      value={v}
      placeholder={placeholder}
      onChange={e => {
        if (readOnly) return;
        setV(e.target.value);
        onChange && onChange(e.target.value);
      }}
      disabled={readOnly}
      readOnly={readOnly}
      className={`w-full min-h-[56px] leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-1 focus:ring-brand text-sm text-left ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ overflow: 'hidden', resize: 'none' }}
      rows={1}
      onInput={e => {
        if (readOnly) return;
        adjustHeight();
      }}
    />
  );
}


