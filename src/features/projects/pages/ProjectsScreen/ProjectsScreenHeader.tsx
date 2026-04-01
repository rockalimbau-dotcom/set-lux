import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LogoIcon from '@shared/components/LogoIcon';
import { ThemeToggleButton } from '@app/App/ThemeToggleButton';
import { storage } from '@shared/services/localStorage.service';

interface ProjectsScreenHeaderProps {
  userName: string;
  onNewProject: () => void;
  onPerfil?: () => void;
  onConfig?: () => void;
  onSalir?: () => void;
}

export function ProjectsScreenHeader({
  userName,
  onNewProject,
  onPerfil,
  onConfig,
  onSalir,
}: ProjectsScreenHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLockedByTutorial, setMenuLockedByTutorial] = useState(false);
  const [hoveredUserMenuOption, setHoveredUserMenuOption] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const isLight = theme === 'light';
  const focusColor = isLight ? '#0476D9' : '#F27405';
  const profile = storage.getJSON<any>('profile_v1') || {};
  const gender = profile.gender || 'neutral';
  const genderContext = gender === 'male' || gender === 'female' || gender === 'neutral' ? gender : 'neutral';

  useEffect(() => {
    const handleOpen = () => {
      setMenuLockedByTutorial(true);
      setMenuOpen(true);
    };
    const handleClose = () => {
      setMenuLockedByTutorial(false);
      setMenuOpen(false);
    };
    window.addEventListener('tutorial-profile-menu-open', handleOpen as EventListener);
    window.addEventListener('tutorial-profile-menu-close', handleClose as EventListener);
    return () => {
      window.removeEventListener('tutorial-profile-menu-open', handleOpen as EventListener);
      window.removeEventListener('tutorial-profile-menu-close', handleClose as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleDocClick = (event: MouseEvent) => {
      if (menuLockedByTutorial) return;
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (menuLockedByTutorial) return;
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuLockedByTutorial]);

  return (
    <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6' style={{backgroundColor: 'var(--bg)', minHeight: 'auto', position: 'relative', contain: 'layout style', marginTop: 0, paddingTop: '1.5rem', paddingBottom: '0.5rem', zIndex: 10}}>
      <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout', zIndex: 10}}>
        {/* Header limpio */}
        <div className='flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8' style={{minHeight: 'auto', position: 'relative', contain: 'layout', zIndex: 10}}>
          <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6' style={{position: 'relative', willChange: 'auto', transform: 'translateZ(0)'}}>
            <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20' style={{position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
              <LogoIcon size={32} className='sm:!w-[40px] sm:!h-[40px] md:!w-[48px] md:!h-[48px] lg:!w-[64px] lg:!h-[64px] xl:!w-[80px] xl:!h-[80px]' />
            </div>
            <h1 className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold' style={{color: 'var(--text)'}}>
              SetLux <span className='mx-0.5 sm:mx-1 md:mx-1.5 lg:mx-2' style={{color: 'var(--text)'}}>›</span> <span style={{color: 'var(--text)'}}>{t('common.projects')}</span>
            </h1>
          </div>

          {/* Botón Nuevo Proyecto */}
          <div className='relative flex items-center gap-2' style={{minHeight: 'auto', justifyContent: 'flex-start'}}>
            <ThemeToggleButton />
            <button
              onClick={onNewProject}
              data-tutorial='new-project'
              className='px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-md sm:rounded-lg md:rounded-xl font-semibold text-white transition-all hover:shadow-lg border border-transparent hover:border-[var(--hover-border)] text-[10px] sm:text-xs'
              style={{backgroundColor: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#0468BF' : 'var(--brand)'}}
            >
              {t('common.newProject')}
            </button>
            {/* Menú de usuario */}
            <div className='absolute right-0 top-full mt-1 sm:mt-2' ref={menuRef}>
              <button
                onClick={() => {
                  if (menuLockedByTutorial) return;
                  setMenuOpen(!menuOpen);
                }}
                data-tutorial='projects-user-menu-trigger'
                aria-haspopup='menu'
                aria-expanded={menuOpen}
                className='inline-flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-md sm:rounded-lg md:rounded-xl min-h-[34px] sm:min-h-[36px] min-w-[118px] sm:min-w-[126px] font-semibold transition-all cursor-pointer border text-[11px] sm:text-xs whitespace-nowrap'
                style={{
                  borderColor: menuOpen ? focusColor : (isLight ? 'rgba(229,231,235,0.9)' : 'var(--border)'),
                  backgroundColor: menuOpen ? (isLight ? '#E8F4FD' : 'rgba(242,116,5,0.12)') : 'var(--panel)',
                  color: isLight ? '#111827' : 'var(--text)',
                }}
              >
                <span
                  className='inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold flex-shrink-0'
                  style={{
                    backgroundColor: isLight ? '#0468BF' : '#F27405',
                    color: '#ffffff',
                  }}
                >
                  {String(userName || 'U').trim().charAt(0).toUpperCase()}
                </span>
                <span className='font-semibold text-[11px] sm:text-xs'>
                  {t('common.myAccount')}
                </span>
                <span className='flex-shrink-0' style={{ fontSize: '10px' }}>
                  {menuOpen ? '▲' : '▼'}
                </span>
              </button>
              
              {/* Menú desplegable */}
              {menuOpen && (
                <div 
                  data-tutorial='projects-user-menu-panel'
                  className='absolute right-0 top-full mt-1.5 sm:mt-2 w-[min(88vw,16rem)] sm:w-48 md:w-56 max-w-[calc(100vw-1rem)] rounded-md md:rounded-lg shadow-lg border py-1 md:py-1.5 animate-in fade-in slide-in-from-top-1 duration-150'
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)',
                    zIndex: 100
                  }}
                >
                  <div className='px-3 md:px-4 pb-1.5 md:pb-2 border-b' style={{ borderColor: isLight ? '#e5e7eb' : 'var(--border)' }}>
                    <div className='text-[10px] sm:text-xs font-semibold' style={{ color: isLight ? '#374151' : '#cbd5e1' }}>
                      {t('common.welcome', { context: genderContext })}
                    </div>
                    <div className='text-[11px] sm:text-xs md:text-sm font-semibold' style={{ color: isLight ? '#111827' : '#ffffff' }}>
                      {userName}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onPerfil?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={() => setHoveredUserMenuOption('perfil')}
                    onMouseLeave={() => setHoveredUserMenuOption(null)}
                    className='w-full text-left px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm transition-colors'
                    style={{
                      color: hoveredUserMenuOption === 'perfil' 
                        ? (isLight ? '#111827' : 'white')
                        : 'var(--text)',
                      backgroundColor: hoveredUserMenuOption === 'perfil' 
                        ? (isLight ? '#A0D3F2' : focusColor)
                        : 'transparent',
                    }}
                  >
                    👤 {t('navigation.profile')}
                  </button>
                  <button
                    onClick={() => {
                      onConfig?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={() => setHoveredUserMenuOption('config')}
                    onMouseLeave={() => setHoveredUserMenuOption(null)}
                    className='w-full text-left px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm transition-colors'
                    style={{
                      color: hoveredUserMenuOption === 'config' 
                        ? (isLight ? '#111827' : 'white')
                        : 'var(--text)',
                      backgroundColor: hoveredUserMenuOption === 'config' 
                        ? (isLight ? '#A0D3F2' : focusColor)
                        : 'transparent',
                    }}
                  >
                    ⚙️ {t('navigation.settings')}
                  </button>
                  <button
                    onClick={() => {
                      onSalir?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={() => setHoveredUserMenuOption('salir')}
                    onMouseLeave={() => setHoveredUserMenuOption(null)}
                    className='w-full text-left px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm transition-colors'
                    style={{
                      color: hoveredUserMenuOption === 'salir' 
                        ? (isLight ? '#111827' : 'white')
                        : 'var(--text)',
                      backgroundColor: hoveredUserMenuOption === 'salir' 
                        ? (isLight ? '#A0D3F2' : focusColor)
                        : 'transparent',
                    }}
                  >
                    🚪 {t('common.exit')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
