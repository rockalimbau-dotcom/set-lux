import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';
import { ROLES } from '@shared/constants/roles';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [saved, setSaved] = useState(false);

  // Dropdown de rol
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isRoleButtonHovered, setIsRoleButtonHovered] = useState(false);
  const [hoveredRoleOption, setHoveredRoleOption] = useState<string | null>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = storage.getJSON<any>('profile_v1') || {};
    // Si hay nombre y apellido separados, usarlos; si no, intentar separar el name
    if (data.nombre && data.apellido) {
      setNombre(data.nombre || '');
      setApellido(data.apellido || '');
    } else if (data.name) {
      // Intentar separar el nombre completo
      const parts = data.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setNombre(parts[0] || '');
        setApellido(parts.slice(1).join(' ') || '');
      } else {
        setNombre(parts[0] || '');
        setApellido('');
      }
    } else {
      setNombre('');
      setApellido('');
    }
    setEmail(data.email || '');
    setRole(data.role || '');
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
        setIsRoleButtonHovered(false);
        setHoveredRoleOption(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const save = () => {
    const fullName = `${nombre} ${apellido}`.trim();
    storage.setJSON('profile_v1', { 
      name: fullName,
      nombre: nombre,
      apellido: apellido,
      email, 
      role
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const theme = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
  const isLight = theme === 'light';
  const focusColor = isLight ? '#0476D9' : '#F27405';

  const roleOptions: string[] = Array.isArray(ROLES)
    ? ROLES.map(r => (typeof r === 'string' ? r : (r as any).label as string))
    : [];
  return (
    <div className='min-h-screen bg-neutral-bg text-neutral-text pb-12' style={{paddingTop: 0}}>
      {/* Header moderno y prominente */}
      <div className='px-5 sm:px-6 md:px-7 lg:px-8 xl:px-6' style={{backgroundColor: 'var(--bg)', minHeight: 'auto', position: 'relative', contain: 'layout style', marginTop: 0, paddingTop: '1.5rem', paddingBottom: '0.5rem', zIndex: 10}}>
        <div className='max-w-6xl mx-auto' style={{position: 'relative', contain: 'layout', zIndex: 10}}>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-8' style={{minHeight: 'auto', position: 'relative', contain: 'layout', zIndex: 10}}>
            <div className='flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20' style={{position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(0)'}}>
                <LogoIcon size={32} className='sm:!w-[40px] sm:!h-[40px] md:!w-[48px] md:!h-[48px] lg:!w-[64px] lg:!h-[64px] xl:!w-[80px] xl:!h-[80px]' onClick={() => navigate('/projects')} />
              </div>
              <h1 className='text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold' style={{color: 'var(--text)'}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  SetLux
                </button> <span className='mx-0.5 sm:mx-1 md:mx-1.5 lg:mx-2' style={{color: 'var(--text)'}}>›</span> <span style={{color: 'var(--text)'}}>{t('profile.title')}</span>
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

      <div className='max-w-6xl mx-auto px-8 sm:px-10 md:px-12 lg:px-16 xl:px-20 py-4 sm:py-5 md:py-6 profile-form-container-landscape flex justify-center'>
        <div className='max-w-[240px] sm:max-w-[260px] md:max-w-md lg:max-w-lg xl:max-w-xl w-full rounded sm:rounded-md md:rounded-lg lg:rounded-xl xl:rounded-2xl border p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5' style={{backgroundColor: 'var(--panel)', borderColor: 'var(--border)'}}>
          <h3 className='text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-2 sm:mb-2.5 md:mb-3 lg:mb-4 xl:mb-5' style={{color: isLight ? '#0468BF' : '#F27405'}}>{t('common.userData')}</h3>

        <div className='space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 xl:space-y-5'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3'>
            <label className='block space-y-0.5 sm:space-y-1 md:space-y-1.5'>
              <span className='text-[10px] sm:text-xs md:text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.firstName')}</span>
              <input
                className='w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none focus:ring-1 transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base'
                style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: '0 0 0 1px transparent'}}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder={t('auth.firstNamePlaceholder')}
              />
            </label>
            <label className='block space-y-0.5 sm:space-y-1 md:space-y-1.5'>
              <span className='text-[10px] sm:text-xs md:text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.lastName')}</span>
              <input
                className='w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none focus:ring-1 transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base'
                style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: '0 0 0 1px transparent'}}
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder={t('auth.lastNamePlaceholder')}
              />
            </label>
          </div>

          <label className='block space-y-0.5 sm:space-y-1 md:space-y-1.5'>
            <span className='text-[10px] sm:text-xs md:text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.email')}</span>
            <input
              type='email'
              className='w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none focus:ring-1 transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base'
              style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)'}}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
            />
          </label>

          <label className='block space-y-0.5 sm:space-y-1 md:space-y-1.5'>
            <span className='text-[10px] sm:text-xs md:text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.role')}</span>
            <div className='relative w-full' ref={roleDropdownRef}>
              <button
                type='button'
                onClick={() => setRoleDropdownOpen(prev => !prev)}
                onMouseEnter={() => setIsRoleButtonHovered(true)}
                onMouseLeave={() => setIsRoleButtonHovered(false)}
                onBlur={() => setIsRoleButtonHovered(false)}
                className='w-full px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2.5 xl:px-4 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl border focus:outline-none text-[10px] sm:text-xs md:text-sm lg:text-base text-left transition-colors'
                style={{
                  backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)',
                  color: 'var(--text)',
                  borderWidth: isRoleButtonHovered ? '1.5px' : '1px',
                  borderStyle: 'solid',
                  borderColor: isRoleButtonHovered
                    ? (isLight ? '#0476D9' : '#ffffff')
                    : 'var(--border)',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 12 12'%3E%3Cpath fill='${isLight ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  paddingRight: '1.75rem',
                }}
              >
                {role || '\u00A0'}
              </button>
              {roleDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                    isLight ? 'bg-white' : 'bg-neutral-panel'
                  }`}
                >
                  {roleOptions.map(option => (
                    <button
                      key={option}
                      type='button'
                      onClick={() => {
                        setRole(option);
                        setRoleDropdownOpen(false);
                        setHoveredRoleOption(null);
                      }}
                      onMouseEnter={() => setHoveredRoleOption(option)}
                      onMouseLeave={() => setHoveredRoleOption(null)}
                      className={`w-full text-left px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2 text-[10px] sm:text-xs md:text-sm lg:text-base transition-colors ${
                        isLight ? 'text-gray-900' : 'text-zinc-300'
                      }`}
                      style={{
                        backgroundColor:
                          hoveredRoleOption === option
                            ? (isLight ? '#A0D3F2' : focusColor)
                            : 'transparent',
                        color:
                          hoveredRoleOption === option
                            ? (isLight ? '#111827' : 'white')
                            : 'inherit',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
        </div>

        <div className='flex justify-end gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 mt-2 sm:mt-2.5 md:mt-3 lg:mt-4 xl:mt-5'>
          <button 
            onClick={save} 
            className='px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 rounded sm:rounded-md md:rounded-lg lg:rounded-xl font-semibold text-white transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base'
            style={{backgroundColor: isLight ? '#0468BF' : '#F27405'}}
          >
            {t('common.save')}
          </button>
        </div>

        {saved && (
          <div className='mt-1.5 sm:mt-2 md:mt-2.5 lg:mt-3 xl:mt-4 text-[10px] sm:text-xs md:text-sm text-green-400 font-medium'>{t('profile.saveSuccess')}</div>
        )}
        </div>
      </div>
    </div>
  );
}


