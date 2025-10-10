import { useState, useEffect } from 'react';
import LogoIcon from '@shared/components/LogoIcon';
import { storage } from '@shared/services/localStorage.service';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = storage.getJSON<any>('profile_v1') || {};
    setName(data.name || '');
    setEmail(data.email || '');
    setRole(data.role || '');
  }, []);

  const save = () => {
    storage.setJSON('profile_v1', { name, email, role });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const theme = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'dark';
  const isLight = theme === 'light';
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
        <div className='max-w-2xl w-full rounded-2xl border p-8' style={{backgroundColor: 'var(--panel)', borderColor: 'var(--border)'}}>
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
            <input
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors'
              style={{backgroundColor: isLight ? '#ffffff' : 'rgba(0,0,0,0.4)', color: 'var(--text)', borderColor: 'var(--border)'}}
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder='Tu rol'
            />
          </label>
        </div>

        <div className='flex justify-end gap-4 mt-8'>
          <a 
            href='/projects' 
            className='px-6 py-3 rounded-xl border transition-colors font-medium'
            style={{borderColor: 'var(--border)', color: isLight ? '#374151' : '#d1d5db'}}
          >
            Volver
          </a>
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


