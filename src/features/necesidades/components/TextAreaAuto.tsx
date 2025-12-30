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
  useEffect(() => setV(value || ''), [value]);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = '0px';
    ref.current.style.height = ref.current.scrollHeight + 'px';
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
        const el = e.target as HTMLTextAreaElement;
        el.style.height = '0px';
        el.style.height = el.scrollHeight + 'px';
      }}
    />
  );
}


