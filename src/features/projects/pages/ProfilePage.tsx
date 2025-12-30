import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';
import { ROLES } from '@shared/constants/roles';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
    setName(data.name || '');
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
    storage.setJSON('profile_v1', { name, email, role });
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
    <div className='min-h-screen' style={{backgroundColor: 'var(--bg)', color: 'var(--text)'}}>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: 'var(--bg)'}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold' style={{color: 'var(--text)'}}>
                <button 
                  onClick={() => navigate('/projects')}
                  className='hover:underline transition-all'
                  style={{color: 'var(--text)'}}
                >
                  SetLux
                </button> <span className='text-gray-300 mx-2' style={{color: isLight ? '#374151' : '#d1d5db'}}>›</span> <span className='text-gray-300' style={{color: isLight ? '#374151' : '#d1d5db'}}>Perfil</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-md w-full rounded-2xl border p-8' style={{backgroundColor: 'var(--panel)', borderColor: 'var(--border)'}}>
          <h3 className='text-xl font-semibold mb-6' style={{color: isLight ? '#0476D9' : '#f97316'}}>Datos de usuario</h3>

        <div className='space-y-6'>
          <label className='block space-y-2'>
            <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>Nombre</span>
            <input
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
              style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)', boxShadow: '0 0 0 1px transparent'}}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Tu nombre'
            />
          </label>

          <label className='block space-y-2'>
            <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>Email</span>
            <input
              type='email'
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
              style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)'}}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='tucorreo@ejemplo.com'
            />
          </label>

          <label className='block space-y-2'>
            <span className='text-sm font-medium' style={{color: isLight ? '#6b7280' : '#d1d5db'}}>Rol</span>
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
            style={{backgroundColor: isLight ? '#0476D9' : '#f97316'}}
          >
            Guardar
          </button>
        </div>

        {saved && (
          <div className='mt-4 text-sm text-green-400 font-medium'>Perfil guardado ✓</div>
        )}
        </div>
      </div>
    </div>
  );
}


