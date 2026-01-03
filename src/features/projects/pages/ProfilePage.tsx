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
    <div className='min-h-screen pb-12' style={{backgroundColor: 'var(--bg)', color: 'var(--text)'}}>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} onClick={() => navigate('/projects')} />
              <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  SetLux
                </button> <span className='mx-2' style={{color: 'var(--text)'}}>›</span> <span style={{color: 'var(--text)'}}>{t('profile.title')}</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-md w-full rounded-2xl border p-8' style={{backgroundColor: 'var(--panel)', borderColor: 'var(--border)'}}>
          <h3 className='text-xl font-semibold mb-6' style={{color: isLight ? '#0468BF' : '#F27405'}}>{t('common.userData')}</h3>

        <div className='space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.firstName')}</span>
              <input
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
                style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: '0 0 0 1px transparent'}}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder={t('auth.firstNamePlaceholder')}
              />
            </label>
            <label className='block space-y-2'>
              <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.lastName')}</span>
              <input
                className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
                style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: '0 0 0 1px transparent'}}
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder={t('auth.lastNamePlaceholder')}
              />
            </label>
          </div>

          <label className='block space-y-2'>
            <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.email')}</span>
            <input
              type='email'
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
              style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)'}}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
            />
          </label>

          <label className='block space-y-2'>
            <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>{t('common.role')}</span>
            <div className='relative w-full' ref={roleDropdownRef}>
              <button
                type='button'
                onClick={() => setRoleDropdownOpen(prev => !prev)}
                onMouseEnter={() => setIsRoleButtonHovered(true)}
                onMouseLeave={() => setIsRoleButtonHovered(false)}
                onBlur={() => setIsRoleButtonHovered(false)}
                className='w-full px-4 py-3 rounded-xl border focus:outline-none text-sm text-left transition-colors'
                style={{
                  backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)',
                  color: 'var(--text)',
                  borderWidth: isRoleButtonHovered ? '1.5px' : '1px',
                  borderStyle: 'solid',
                  borderColor: isRoleButtonHovered
                    ? (isLight ? '#0476D9' : '#ffffff')
                    : 'var(--border)',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${isLight ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
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
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
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

        <div className='flex justify-end gap-4 mt-8'>
          <button 
            onClick={save} 
            className='px-6 py-3 rounded-xl font-semibold text-white transition-colors'
            style={{backgroundColor: isLight ? '#0468BF' : '#F27405'}}
          >
            {t('common.save')}
          </button>
        </div>

        {saved && (
          <div className='mt-4 text-sm text-green-400 font-medium'>{t('profile.saveSuccess')}</div>
        )}
        </div>
      </div>
    </div>
  );
}


