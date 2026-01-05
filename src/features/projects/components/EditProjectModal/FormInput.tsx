import React from 'react';
import { ProjectFormField } from '../ProjectFormField';
import { getBorderStyles } from './EditProjectModalUtils';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBlur: () => void;
  fieldKey: string;
}

export function FormInput({
  label,
  value,
  onChange,
  theme,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onBlur,
  fieldKey,
}: FormInputProps) {
  return (
    <ProjectFormField label={label} theme={theme}>
      <input
        className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${
          theme === 'light' ? 'bg-white text-gray-900' : 'bg-black/40 text-zinc-300'
        }`}
        style={getBorderStyles(isHovered, theme)}
        value={value}
        onChange={e => onChange(e.target.value)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onBlur={onBlur}
        data-field={fieldKey}
      />
    </ProjectFormField>
  );
}

