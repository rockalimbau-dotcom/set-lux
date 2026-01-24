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
      data-tutorial='theme-toggle'
      onClick={toggleTheme}
      className='px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-lg sm:rounded-xl border hover:border-[var(--hover-border)] text-[10px] sm:text-xs'
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

