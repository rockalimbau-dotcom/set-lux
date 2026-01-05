interface FieldProps {
  label: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function ProjectFormField({ label, children, theme = 'light' }: FieldProps) {
  return (
    <label className='space-y-1'>
      <span className={`block text-sm ${theme === 'light' ? 'text-gray-900' : 'text-zinc-300'}`}>{label}</span>
      {children}
    </label>
  );
}

