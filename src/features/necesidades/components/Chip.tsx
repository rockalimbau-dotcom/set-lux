import React from 'react';
import { useTranslation } from 'react-i18next';
import { ROLE_COLORS } from '../../../shared/constants/roles';

type ChipProps = {
  role?: string;
  name?: string;
  onRemove?: () => void;
  context?: 'prelight' | 'pickup' | string;
  readOnly?: boolean;
};

export default function Chip({ role, name, onRemove, context, readOnly = false }: ChipProps) {
  const { t } = useTranslation();
  const base = String(role || '').toUpperCase();
  const col = (ROLE_COLORS && (ROLE_COLORS as any)[base]) || { bg: '#444', fg: '#fff' };
  const roleLabels: Record<string, string> = {
    G: 'G',
    BB: 'BB',
    E: 'E',
    TM: 'TM',
    FB: 'FB',
    AUX: 'AUX',
    M: 'M',
    REF: 'R',
  };
  let label = roleLabels[base] || base;
  if (context === 'prelight') label = `${label}P`;
  if (context === 'pickup') label = `${label}R`;
  return (
    <span className='inline-flex items-center gap-2 px-2 py-1 rounded-lg border border-neutral-border bg-black/40'>
      <span
        className='inline-flex items-center justify-center w-6 h-5 rounded-md font-bold text-[10px]'
        style={{ background: (col as any).bg, color: (col as any).fg }}
      >
        {label || '—'}
      </span>
      <span className='text-xs text-zinc-200'>{name || '—'}</span>
      {!readOnly && (
        <button
          onClick={onRemove}
          className='text-zinc-400 hover:text-red-500 text-xs'
          title={t('needs.remove')}
        >
          ×
        </button>
      )}
    </span>
  );
}


