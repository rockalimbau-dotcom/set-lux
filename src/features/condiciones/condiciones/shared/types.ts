export interface TextAreaAutoProps {
  value: string;
  onChange?: (val: string) => void;
  className?: string;
  readOnly?: boolean;
}

export interface InfoCardProps {
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

export interface DuoField {
  value: string;
  onChange: (val: string) => void;
}

export interface ParamInputProps {
  label: string;
  value?: string;
  onChange?: (val: string) => void;
  suffix?: string;
  duo?: [DuoField, DuoField];
  type?: 'number' | 'time' | 'text';
  readOnly?: boolean;
}

