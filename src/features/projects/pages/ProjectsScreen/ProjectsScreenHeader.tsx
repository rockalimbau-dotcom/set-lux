import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LogoIcon from '@shared/components/LogoIcon';

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
  const [hoveredUserMenuOption, setHoveredUserMenuOption] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const isLight = theme === 'light';
  const focusColor = isLight ? '#0476D9' : '#F27405';

  return (
    <div className='px-6 py-8' style={{backgroundColor: 'var(--bg)', minHeight: '120px', position: 'relative', contain: 'layout style', marginTop: 0, paddingTop: '2rem', paddingBottom: '2rem', zIndex: 10}}>
      <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout', zIndex: 10}}>
        {/* Header limpio */}
        <div className='flex items-center justify-between mb-8' style={{minHeight: '80px', position: 'relative', contain: 'layout', zIndex: 10}}>
          <div className='flex items-center gap-6' style={{position: 'relative', willChange: 'auto', transform: 'translateZ(0)'}}>
            <div style={{width: '80px', height: '80px', position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
              <LogoIcon size={80} />
            </div>
            <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
              SetLux <span className='mx-2' style={{color: 'var(--text)'}}>›</span> <span style={{color: 'var(--text)'}}>{t('common.projects')}</span>
            </h1>
          </div>

          {/* Botón Nuevo Proyecto */}
          <div className='flex flex-col items-end gap-2' style={{minHeight: '60px', justifyContent: 'flex-start'}}>
            <button
              onClick={onNewProject}
              className='px-4 py-2 rounded-xl font-semibold text-white transition-all hover:shadow-lg border border-transparent hover:border-[var(--hover-border)] text-sm'
              style={{backgroundColor: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#0468BF' : 'var(--brand)'}}
            >
              {t('common.newProject')}
            </button>
            {/* Saludo de bienvenida */}
            <div className='relative' ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className='text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer'
              >
                <span style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#111827' : undefined}}>{t('common.welcome')} </span>
                <span className='font-semibold' style={{color: (document.documentElement.getAttribute('data-theme')||'dark')==='light' ? '#0468BF' : '#F27405'}}>{userName}</span> ✨
              </button>
              
              {/* Menú desplegable */}
              {menuOpen && (
                <div 
                  className='absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border py-2'
                  style={{
                    backgroundColor: 'var(--panel)',
                    borderColor: isLight ? 'rgba(229,231,235,0.6)' : 'var(--border)',
                    zIndex: 100
                  }}
                >
                  <button
                    onClick={() => {
                      onPerfil?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={() => setHoveredUserMenuOption('perfil')}
                    onMouseLeave={() => setHoveredUserMenuOption(null)}
                    className='w-full text-left px-4 py-2 text-sm transition-colors'
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
                    className='w-full text-left px-4 py-2 text-sm transition-colors'
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
                    className='w-full text-left px-4 py-2 text-sm transition-colors'
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

