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

  return (
    <div className='min-h-screen' style={{backgroundColor: '#1a2b40', color: '#ffffff'}}>
      {/* Header moderno y prominente */}
      <div className='px-6 py-8' style={{backgroundColor: '#1a2b40'}}>
        <div className='max-w-6xl mx-auto'>
          {/* Header limpio */}
          <div className='flex items-center justify-between mb-8'>
            <div className='flex items-center gap-6'>
              <LogoIcon size={80} />
              <h1 className='text-3xl font-bold text-white'>
                SetLux <span className='text-gray-300'>/ Perfil</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto p-6 flex justify-center'>
        <div className='max-w-2xl w-full rounded-2xl border p-8' style={{backgroundColor: '#2a4058', borderColor: '#3b5568'}}>
          <h3 className='text-orange-500 text-xl font-semibold mb-6'>Datos de usuario</h3>

        <div className='space-y-6'>
          <label className='block space-y-2'>
            <span className='text-sm font-medium text-zinc-300'>Nombre</span>
            <input
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
              style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Tu nombre'
            />
          </label>

          <label className='block space-y-2'>
            <span className='text-sm font-medium text-zinc-300'>Email</span>
            <input
              type='email'
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
              style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='tucorreo@ejemplo.com'
            />
          </label>

          <label className='block space-y-2'>
            <span className='text-sm font-medium text-zinc-300'>Rol</span>
            <input
              className='w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors'
              style={{backgroundColor: 'rgba(0,0,0,0.4)', color: '#ffffff', borderColor: '#3b5568'}}
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder='Tu rol'
            />
          </label>
        </div>

        <div className='flex justify-end gap-4 mt-8'>
          <a 
            href='/projects' 
            className='px-6 py-3 rounded-xl border hover:border-orange-500 text-zinc-300 hover:text-orange-500 transition-colors font-medium'
            style={{borderColor: '#3b5568'}}
          >
            Volver
          </a>
          <button 
            onClick={save} 
            className='px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg'
            style={{backgroundColor: '#f97316'}}
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


