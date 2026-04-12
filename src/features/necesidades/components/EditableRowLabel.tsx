import React from 'react';

type EditableRowLabelProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  variant?: 'input' | 'inline';
};

export default function EditableRowLabel({
  value,
  onChange,
  readOnly = false,
  placeholder,
  leading,
  trailing,
  className = '',
  variant = 'input',
}: EditableRowLabelProps) {
  const inlineRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (variant !== 'inline' || !inlineRef.current) return;
    if (inlineRef.current.textContent !== value) {
      inlineRef.current.textContent = value;
    }
  }, [value, variant]);

  return (
    <div className={`editable-row-label flex items-center gap-2 w-full min-w-0 ${className}`.trim()}>
      {leading}
      {readOnly ? (
        <span className='flex-1 min-w-0 whitespace-normal break-normal'>{value}</span>
      ) : variant === 'inline' ? (
        <div
          ref={inlineRef}
          role='textbox'
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder={placeholder}
          onClick={event => event.stopPropagation()}
          onMouseDown={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
          onKeyUp={event => event.stopPropagation()}
          onInput={event => onChange?.(event.currentTarget.textContent ?? '')}
          className='editable-row-label__inline flex-1 min-w-0 w-full whitespace-normal break-normal cursor-text'
        />
      ) : (
        <input
          type='text'
          value={value}
          onChange={event => onChange?.(event.target.value)}
          onKeyDown={event => event.stopPropagation()}
          onKeyUp={event => event.stopPropagation()}
          placeholder={placeholder}
          spellCheck={false}
          className='editable-row-label__input flex-1 min-w-0 w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none ring-0 appearance-none focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 whitespace-normal break-words'
        />
      )}
      {trailing}
    </div>
  );
}
