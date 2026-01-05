import React from 'react';
import { useTheme } from './useTheme';

/**
 * Theme toggle button component
 */
export function ThemeToggleButton() {
  const { themeLabel, toggleTheme } = useTheme();

  return (
    <button
      type='button'
      onClick={toggleTheme}
      className='px-4 py-2 rounded-xl border hover:border-[var(--hover-border)] text-sm'
      style={{
        backgroundColor:
          (typeof document !== 'undefined' && (document.documentElement.getAttribute('data-theme') || 'dark') === 'light')
            ? '#A0D3F2'
            : '#f59e0b',
        color:
          (typeof document !== 'undefined' && (document.documentElement.getAttribute('data-theme') || 'dark') === 'light')
            ? '#111827'
            : '#ffffff',
        borderColor:
          (typeof document !== 'undefined' && (document.documentElement.getAttribute('data-theme') || 'dark') === 'light')
            ? '#A0D3F2'
            : '#f59e0b'
      }}
      title={themeLabel}
      aria-pressed={document.documentElement.getAttribute('data-theme') === 'light'}
    >
      {themeLabel}
    </button>
  );
}

