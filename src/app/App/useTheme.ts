import { useState, useEffect } from 'react';
import i18n from '../../i18n/config';
import { storage } from '@shared/services/localStorage.service';

/**
 * Hook to manage theme state and updates
 */
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  const [themeLabel, setThemeLabel] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Update theme label when theme or language changes
  useEffect(() => {
    const updateThemeLabel = () => {
      const curr = currentTheme;
      setThemeLabel(curr === 'light' ? i18n.t('auth.daylight') : i18n.t('auth.darklight'));
    };
    updateThemeLabel();
    
    // Listen for language changes
    const handleLanguageChange = () => {
      updateThemeLabel();
    };
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [currentTheme]);

  // Initialize theme from storage/localStorage
  useEffect(() => {
    try {
      const s = storage.getJSON<any>('settings_v1') || {};
      const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || '';
      const initial = ((saved === 'light' || saved === 'dark') ? saved : (s.theme === 'light' || s.theme === 'dark' ? s.theme : 'light')) as 'light' | 'dark';
      setCurrentTheme(initial);
      const root = document.documentElement;
      root.setAttribute('data-theme', initial);
      setThemeLabel(initial === 'light' ? i18n.t('auth.daylight') : i18n.t('auth.darklight'));
      const body = document.body as any;
      body.style.backgroundColor = 'var(--bg)';
      body.style.color = 'var(--text)';
      // Keep storages in sync
      try {
        localStorage.setItem('theme', initial);
        storage.setJSON('settings_v1', { ...s, theme: initial });
      } catch {}
    } catch {}
  }, []);

  // Observe theme changes
  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    let next = 'dark';
    try {
      const root = document.documentElement;
      const curr = root.getAttribute('data-theme') || 'dark';
      next = curr === 'light' ? 'dark' : 'light';
      setCurrentTheme(next as 'light' | 'dark');
      root.setAttribute('data-theme', next);
      setThemeLabel(next === 'light' ? i18n.t('auth.daylight') : i18n.t('auth.darklight'));
      const body = document.body as any;
      body.style.backgroundColor = 'var(--bg)';
      body.style.color = 'var(--text)';
    } catch {}
    // Persist preference in both locations to maintain sync
    try { 
      localStorage.setItem('theme', next);
      const s = storage.getJSON<any>('settings_v1') || {};
      storage.setJSON('settings_v1', { ...s, theme: next });
    } catch {}
  };

  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';

  return { theme, themeLabel, currentTheme, toggleTheme, focusColor };
}

