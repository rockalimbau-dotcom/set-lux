import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';

export default function SettingsPage() {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = storage.getJSON<any>('settings_v1') || {};
    // Check localStorage first for theme (for compatibility with App.tsx)
    const localTheme = typeof localStorage !== 'undefined' && localStorage.getItem('theme');
    const themeFromSettings = s.theme || localTheme || 'light';
    setTheme(themeFromSettings as 'dark' | 'light');
    setLanguage(s.language || 'es');
  }, []);

  // Apply live preview to body when theme changes (local preview only)
  useEffect(() => {
    // Set attribute for global theming
    document.documentElement.setAttribute('data-theme', theme);
    // Sync with localStorage for App.tsx compatibility
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);


  const save = () => {
    storage.setJSON('settings_v1', { theme, language });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const isLight = theme === 'light';
  const colors = {
    pageBg: isLight ? '#FFF7ED' : '#1a2b40',
    pageText: isLight ? '#111827' : '#ffffff',
    headerBg: isLight ? '#FFF7ED' : '#1a2b40',
    panelBg: isLight ? '#ffffff' : '#2a4058',
    panelBorder: isLight ? '#e5e7eb' : '#3b5568',
    inputBg: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)',
    inputText: isLight ? '#111827' : '#ffffff',
    inputBorder: isLight ? '#e5e7eb' : '#3b5568',
    primary: isLight ? '#1D4ED8' : '#f97316', // azul corporativo en claro, naranja en oscuro
    accentText: isLight ? '#1f2937' : '#ffffff',
    mutedText: isLight ? '#6b7280' : '#d1d5db',
    titleMain: isLight ? '#000000' : '#ffffff', // SetLux color
  } as const;

  return (
    <div className='min-h-screen' style={{backgroundColor: colors.pageBg, color: colors.pageText}}>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: colors.headerBg}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold' style={{color: colors.titleMain}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: colors.titleMain}}
                >
                  SetLux
                </button> <span className='text-gray-300 mx-2' style={{color: isLight ? '#374151' : '#d1d5db'}}>›</span> <span className='text-gray-300' style={{color: isLight ? '#374151' : '#d1d5db'}}>Configuración</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-2xl w-full rounded-2xl border p-8' style={{backgroundColor: colors.panelBg, borderColor: colors.panelBorder}}>
          <h3 className='text-xl font-semibold mb-6' style={{color: colors.primary}}>Preferencias</h3>

          <div className='space-y-6'>
            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: colors.mutedText}}>Tema</span>
              <select
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
                style={{backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.inputBorder, boxShadow: `0 0 0 1px transparent`}}
                value={theme}
                onChange={e => setTheme(e.target.value as any)}
              >
                <option value='dark'>Oscuro</option>
                <option value='light'>Claro</option>
              </select>
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: colors.mutedText}}>Idioma</span>
              <select
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
                style={{backgroundColor: colors.inputBg, color: colors.inputText, borderColor: colors.inputBorder}}
                value={language}
                onChange={e => setLanguage(e.target.value as 'es' | 'en')}
              >
                <option value='es'>Español</option>
                <option value='en'>Inglés</option>
              </select>
            </label>

          </div>


          <div className='flex justify-end gap-4 mt-8'>
            <button 
              onClick={save} 
              className='px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg'
              style={{backgroundColor: colors.primary, borderColor: colors.primary}}
            >
              Guardar
            </button>
          </div>

          {saved && (
            <div className='mt-4 text-sm font-medium' style={{color: isLight ? '#059669' : '#34d399'}}>Configuración guardada ✓</div>
          )}
        </div>
      </div>
    </div>
  );
}