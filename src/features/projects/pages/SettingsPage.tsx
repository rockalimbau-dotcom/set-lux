import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@i18n/config';

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [idioma, setIdioma] = useState<string>('Español');
  const [saved, setSaved] = useState(false);

  // Estados para los dropdowns
  const [themeDropdown, setThemeDropdown] = useState({ isOpen: false, isButtonHovered: false, hoveredOption: null as string | null });
  const [idiomaDropdown, setIdiomaDropdown] = useState({ isOpen: false, isButtonHovered: false, hoveredOption: null as string | null });
  
  // Valores internos de idioma (siempre en español para compatibilidad)
  const idiomaValues = ['Español', 'Catalán', 'Inglés'];
  
  // Función helper para obtener el nombre traducido del idioma
  const getLanguageName = (value: string): string => {
    if (value === 'Español') return t('settings.spanish');
    if (value === 'Catalán') return t('settings.catalan');
    if (value === 'Inglés') return t('settings.english');
    return value;
  };

  const themeRef = useRef<HTMLDivElement>(null);
  const idiomaRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (idiomaRef.current && !idiomaRef.current.contains(event.target as Node)) {
        setIdiomaDropdown(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Detectar el tema actual para los estilos
  const currentTheme = theme;
  const focusColor = currentTheme === 'light' ? '#0476D9' : '#F27405';

  // Obtener labels para mostrar
  const themeLabel = theme === 'dark' ? t('settings.dark') : t('settings.light');

  useEffect(() => {
    const s = storage.getJSON<any>('settings_v1') || {};
    // Check localStorage first for theme (for compatibility with App.tsx)
    const localTheme = typeof localStorage !== 'undefined' && localStorage.getItem('theme');
    const themeFromSettings = s.theme || localTheme || 'light';
    setTheme(themeFromSettings as 'dark' | 'light');
    
    // Cargar idioma desde profile_v1 (donde se guarda desde el registro)
    const profile = storage.getJSON<any>('profile_v1') || {};
    setIdioma(profile.idioma || 'Español');
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
    storage.setJSON('settings_v1', { theme });
    // Guardar idioma en el perfil (aunque ya se haya cambiado, lo guardamos para persistencia)
    const profile = storage.getJSON<any>('profile_v1') || {};
    storage.setJSON('profile_v1', { ...profile, idioma: idioma });
    // Asegurar que el idioma esté aplicado (por si acaso)
    changeLanguage(idioma);
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
    primary: isLight ? '#0468BF' : '#F27405', // azul corporativo en claro, naranja en oscuro
    accentText: isLight ? '#1f2937' : '#ffffff',
    mutedText: isLight ? '#6b7280' : '#d1d5db',
    titleMain: isLight ? '#000000' : '#ffffff', // SetLux color
  } as const;

  return (
    <div className='min-h-screen pb-12' style={{backgroundColor: colors.pageBg, color: colors.pageText}}>
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
                </button> <span className='mx-2' style={{color: colors.titleMain}}>›</span> <span style={{color: colors.titleMain}}>{t('settings.title')}</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-md w-full rounded-2xl border p-8' style={{backgroundColor: colors.panelBg, borderColor: colors.panelBorder}}>
          <h3 className='text-xl font-semibold mb-6' style={{color: colors.primary}}>{t('settings.preferences')}</h3>

          <div className='space-y-6'>
            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: colors.mutedText}}>{t('settings.theme')}</span>
              <div className='relative w-full' ref={themeRef}>
                <button
                  type='button'
                  onClick={() => setThemeDropdown(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  onMouseEnter={() => setThemeDropdown(prev => ({ ...prev, isButtonHovered: true }))}
                  onMouseLeave={() => setThemeDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  onBlur={() => setThemeDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none text-sm text-left transition-colors ${
                    currentTheme === 'light' 
                      ? 'bg-white text-gray-900' 
                      : 'bg-black/40 text-zinc-300'
                  }`}
                  style={{
                    borderWidth: themeDropdown.isButtonHovered ? '1.5px' : '1px',
                    borderStyle: 'solid',
                    borderColor: themeDropdown.isButtonHovered && currentTheme === 'light' 
                      ? '#0476D9' 
                      : (themeDropdown.isButtonHovered && currentTheme === 'dark'
                        ? '#fff'
                        : colors.inputBorder),
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${currentTheme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  {themeLabel}
                </button>
                {themeDropdown.isOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                    currentTheme === 'light' ? 'bg-white' : 'bg-neutral-panel'
                  }`}>
                    {[
                      { value: 'dark', label: t('settings.dark') },
                      { value: 'light', label: t('settings.light') }
                    ].map(opcion => (
                      <button
                        key={opcion.value}
                        type='button'
                        onClick={() => {
                          setTheme(opcion.value as 'dark' | 'light');
                          setThemeDropdown({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                        }}
                        onMouseEnter={() => setThemeDropdown(prev => ({ ...prev, hoveredOption: opcion.value }))}
                        onMouseLeave={() => setThemeDropdown(prev => ({ ...prev, hoveredOption: null }))}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          currentTheme === 'light' 
                            ? 'text-gray-900' 
                            : 'text-zinc-300'
                        }`}
                        style={{
                          backgroundColor: themeDropdown.hoveredOption === opcion.value 
                            ? (currentTheme === 'light' ? '#A0D3F2' : focusColor)
                            : 'transparent',
                          color: themeDropdown.hoveredOption === opcion.value 
                            ? (currentTheme === 'light' ? '#111827' : 'white')
                            : 'inherit',
                        }}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: colors.mutedText}}>{t('settings.language')}</span>
              <div className='relative w-full' ref={idiomaRef}>
                <button
                  type='button'
                  onClick={() => setIdiomaDropdown(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  onMouseEnter={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: true }))}
                  onMouseLeave={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  onBlur={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none text-sm text-left transition-colors ${
                    currentTheme === 'light' 
                      ? 'bg-white text-gray-900' 
                      : 'bg-black/40 text-zinc-300'
                  }`}
                  style={{
                    borderWidth: idiomaDropdown.isButtonHovered ? '1.5px' : '1px',
                    borderStyle: 'solid',
                    borderColor: idiomaDropdown.isButtonHovered && currentTheme === 'light' 
                      ? '#0476D9' 
                      : (idiomaDropdown.isButtonHovered && currentTheme === 'dark'
                        ? '#fff'
                        : colors.inputBorder),
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${currentTheme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  {getLanguageName(idioma) || '\u00A0'}
                </button>
                {idiomaDropdown.isOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                    currentTheme === 'light' ? 'bg-white' : 'bg-neutral-panel'
                  }`}>
                    {idiomaValues.map(opcion => (
                      <button
                        key={opcion}
                        type='button'
                        onClick={() => {
                          setIdioma(opcion);
                          // Cambiar el idioma de la aplicación inmediatamente
                          changeLanguage(opcion);
                          setIdiomaDropdown({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                        }}
                        onMouseEnter={() => setIdiomaDropdown(prev => ({ ...prev, hoveredOption: opcion }))}
                        onMouseLeave={() => setIdiomaDropdown(prev => ({ ...prev, hoveredOption: null }))}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          currentTheme === 'light' 
                            ? 'text-gray-900' 
                            : 'text-zinc-300'
                        }`}
                        style={{
                          backgroundColor: idiomaDropdown.hoveredOption === opcion 
                            ? (currentTheme === 'light' ? '#A0D3F2' : focusColor)
                            : 'transparent',
                          color: idiomaDropdown.hoveredOption === opcion 
                            ? (currentTheme === 'light' ? '#111827' : 'white')
                            : 'inherit',
                        }}
                      >
                        {getLanguageName(opcion)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

          </div>


          <div className='flex justify-end gap-4 mt-8'>
            <button 
              onClick={save} 
              className='px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg'
              style={{backgroundColor: colors.primary, borderColor: colors.primary}}
            >
              {t('common.save')}
            </button>
          </div>

          {saved && (
            <div className='mt-4 text-sm font-medium' style={{color: isLight ? '#059669' : '#34d399'}}>{t('settings.saveSuccess')}</div>
          )}
        </div>
      </div>
    </div>
  );
}