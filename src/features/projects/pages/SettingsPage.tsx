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
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [saved, setSaved] = useState(false);

  // Estados para los dropdowns
  const [idiomaDropdown, setIdiomaDropdown] = useState({ isOpen: false, isButtonHovered: false, hoveredOption: null as string | null });
  const [genderDropdown, setGenderDropdown] = useState({ isOpen: false, isButtonHovered: false, hoveredOption: null as string | null });
  
  // Valores internos de idioma (siempre en español para compatibilidad)
  const idiomaValues = ['Español', 'Catalán', 'Inglés'];
  const genderOptions = [
    { value: 'neutral', label: t('settings.genderNeutral') },
    { value: 'male', label: t('settings.genderMale') },
    { value: 'female', label: t('settings.genderFemale') },
  ] as const;
  
  // Función helper para obtener el nombre traducido del idioma
  const getLanguageName = (value: string): string => {
    if (value === 'Español') return t('settings.spanish');
    if (value === 'Catalán') return t('settings.catalan');
    if (value === 'Inglés') return t('settings.english');
    return value;
  };

  const idiomaRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (idiomaRef.current && !idiomaRef.current.contains(event.target as Node)) {
        setIdiomaDropdown(prev => ({ ...prev, isOpen: false }));
      }
      if (genderRef.current && !genderRef.current.contains(event.target as Node)) {
        setGenderDropdown(prev => ({ ...prev, isOpen: false }));
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
  useEffect(() => {
    const s = storage.getJSON<any>('settings_v1') || {};
    // Check localStorage first for theme (for compatibility with App.tsx)
    const localTheme = typeof localStorage !== 'undefined' && localStorage.getItem('theme');
    const themeFromSettings = s.theme || localTheme || 'light';
    setTheme(themeFromSettings as 'dark' | 'light');
    
    // Cargar idioma desde profile_v1 (donde se guarda desde el registro)
    const profile = storage.getJSON<any>('profile_v1') || {};
    setIdioma(profile.idioma || 'Español');
    setGender(profile.gender === 'male' || profile.gender === 'female' || profile.gender === 'neutral' ? profile.gender : 'neutral');
  }, []);

  // Apply live preview to body when theme changes (and persist theme)
  useEffect(() => {
    // Set attribute for global theming
    document.documentElement.setAttribute('data-theme', theme);
    // Sync with localStorage for App.tsx compatibility
    try {
      localStorage.setItem('theme', theme);
    } catch {}
    // Keep settings_v1 in sync so theme persists across sessions
    try {
      const s = storage.getJSON<any>('settings_v1') || {};
      storage.setJSON('settings_v1', { ...s, theme });
    } catch {}
  }, [theme]);


  const save = () => {
    const s = storage.getJSON<any>('settings_v1') || {};
    storage.setJSON('settings_v1', { ...s, theme });
    // Guardar idioma en el perfil (aunque ya se haya cambiado, lo guardamos para persistencia)
    const profile = storage.getJSON<any>('profile_v1') || {};
    storage.setJSON('profile_v1', { ...profile, idioma: idioma, gender });
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
    <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12' style={{paddingTop: 0}}>
      {/* Header moderno y prominente */}
      <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6' style={{backgroundColor: colors.headerBg, minHeight: 'auto', position: 'relative', contain: 'layout style', marginTop: 0, paddingTop: '1.5rem', paddingBottom: '0.5rem', zIndex: 10}}>
        <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout', zIndex: 10}}>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8' style={{minHeight: 'auto', position: 'relative', contain: 'layout', zIndex: 10}}>
            <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20' style={{position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
                <LogoIcon size={32} className='sm:!w-[40px] sm:!h-[40px] md:!w-[48px] md:!h-[48px] lg:!w-[64px] lg:!h-[64px] xl:!w-[80px] xl:!h-[80px]' onClick={() => navigate('/projects')} />
              </div>
              <h1 className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold' style={{color: colors.titleMain}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: colors.titleMain}}
                >
                  SetLux
                </button> <span className='mx-0.5 sm:mx-1 md:mx-1.5 lg:mx-2' style={{color: colors.titleMain}}>›</span> <span style={{color: colors.titleMain}}>{t('settings.title')}</span>
              </h1>
            </div>

            {/* Contenedor derecho vacío para igualar altura con ProjectsScreenHeader */}
            <div className='flex flex-col items-end gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2' style={{minHeight: 'auto', justifyContent: 'flex-start'}}>
              <div className='h-[1.375rem] sm:h-[1.5rem] md:h-[1.625rem] lg:h-[1.75rem] xl:h-[2rem]' style={{visibility: 'hidden'}} aria-hidden="true">
                &nbsp;
              </div>
              <div className='text-[9px] sm:text-[10px] md:text-xs' style={{height: '1.25rem', visibility: 'hidden'}} aria-hidden="true">
                &nbsp;
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-8 sm:px-10 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-5 md:py-6 settings-form-container-landscape flex justify-center'>
        <div className='max-w-[240px] sm:max-w-[260px] md:max-w-md lg:max-w-lg xl:max-w-xl w-full rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5' style={{backgroundColor: colors.panelBg, borderColor: colors.panelBorder}}>
          <h3 className='text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-2 sm:mb-2.5 md:mb-3 lg:mb-4 xl:mb-5' style={{color: colors.primary}}>{t('settings.preferences')}</h3>

          <div className='space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6'>
            <label className='block space-y-1 sm:space-y-1.5 md:space-y-2'>
              <span className='text-xs sm:text-sm font-medium' style={{color: colors.mutedText}}>{t('settings.language')}</span>
              <div className='relative w-full' ref={idiomaRef}>
                <button
                  type='button'
                  onClick={() => setIdiomaDropdown(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  onMouseEnter={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: true }))}
                  onMouseLeave={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  onBlur={() => setIdiomaDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  className={`w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none text-xs sm:text-sm text-left transition-colors ${
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
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 12 12'%3E%3Cpath fill='${currentTheme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    paddingRight: '1.75rem',
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
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevenir que el botón principal pierda el foco antes de cerrar
                          setIdioma(opcion);
                          // Cambiar el idioma de la aplicación inmediatamente
                          changeLanguage(opcion);
                          setIdiomaDropdown({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                        }}
                        onMouseEnter={() => setIdiomaDropdown(prev => ({ ...prev, hoveredOption: opcion }))}
                        onMouseLeave={() => setIdiomaDropdown(prev => ({ ...prev, hoveredOption: null }))}
                        className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs sm:text-sm transition-colors`}
                        style={{
                          backgroundColor: idiomaDropdown.hoveredOption === opcion 
                            ? (currentTheme === 'light' ? '#A0D3F2' : focusColor)
                            : 'transparent',
                          color: idiomaDropdown.hoveredOption === opcion 
                            ? (currentTheme === 'light' ? '#111827' : 'white')
                            : (currentTheme === 'light' ? '#111827' : '#d1d5db'),
                        }}
                      >
                        {getLanguageName(opcion)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <label className='block space-y-1 sm:space-y-1.5 md:space-y-2'>
              <span className='text-xs sm:text-sm font-medium' style={{color: colors.mutedText}}>{t('settings.gender')}</span>
              <div className='relative w-full' ref={genderRef}>
                <button
                  type='button'
                  onClick={() => setGenderDropdown(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                  onMouseEnter={() => setGenderDropdown(prev => ({ ...prev, isButtonHovered: true }))}
                  onMouseLeave={() => setGenderDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  onBlur={() => setGenderDropdown(prev => ({ ...prev, isButtonHovered: false }))}
                  className={`w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none text-xs sm:text-sm text-left transition-colors ${
                    currentTheme === 'light' 
                      ? 'bg-white text-gray-900' 
                      : 'bg-black/40 text-zinc-300'
                  }`}
                  style={{
                    borderWidth: genderDropdown.isButtonHovered ? '1.5px' : '1px',
                    borderStyle: 'solid',
                    borderColor: genderDropdown.isButtonHovered && currentTheme === 'light' 
                      ? '#0476D9' 
                      : (genderDropdown.isButtonHovered && currentTheme === 'dark'
                        ? '#fff'
                        : colors.inputBorder),
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 12 12'%3E%3Cpath fill='${currentTheme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    paddingRight: '1.75rem',
                  }}
                >
                  {genderOptions.find(opt => opt.value === gender)?.label || t('settings.genderNeutral')}
                </button>
                {genderDropdown.isOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                    currentTheme === 'light' ? 'bg-white' : 'bg-neutral-panel'
                  }`}>
                    {genderOptions.map(opcion => (
                      <button
                        key={opcion.value}
                        type='button'
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevenir que el botón principal pierda el foco antes de cerrar
                          setGender(opcion.value);
                          setGenderDropdown({ isOpen: false, isButtonHovered: false, hoveredOption: null });
                        }}
                        onMouseEnter={() => setGenderDropdown(prev => ({ ...prev, hoveredOption: opcion.value }))}
                        onMouseLeave={() => setGenderDropdown(prev => ({ ...prev, hoveredOption: null }))}
                        className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-xs sm:text-sm transition-colors`}
                        style={{
                          backgroundColor: genderDropdown.hoveredOption === opcion.value 
                            ? (currentTheme === 'light' ? '#A0D3F2' : focusColor)
                            : 'transparent',
                          color: genderDropdown.hoveredOption === opcion.value 
                            ? (currentTheme === 'light' ? '#111827' : 'white')
                            : (currentTheme === 'light' ? '#111827' : '#d1d5db'),
                        }}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

          </div>


          <div className='flex justify-end gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-5 md:mt-6 lg:mt-8'>
            <button 
              onClick={save} 
              className='px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-lg sm:rounded-xl font-semibold text-white transition-all hover:shadow-lg text-xs sm:text-sm md:text-base'
              style={{backgroundColor: colors.primary, borderColor: colors.primary}}
            >
              {t('common.save')}
            </button>
          </div>

          {saved && (
            <div className='mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm font-medium' style={{color: isLight ? '#059669' : '#34d399'}}>{t('settings.saveSuccess')}</div>
          )}
        </div>
      </div>
    </div>
  );
}