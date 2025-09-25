import { useState, useEffect } from 'react';
import LogoSetLux from '@shared/components/LogoSetLux';
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
    <div className='min-h-screen bg-neutral-bg text-neutral-text'>
      <div className='px-6 py-6 bg-[#0D0D0D]'>
        <div className='max-w-5xl mx-auto flex flex-col items-center gap-4'>
          <LogoSetLux />
          <div className='flex items-center justify-between w-full relative'>
            <h2 className='text-xl font-bold tracking-wide text-brand'>Perfil</h2>
            <div />
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto p-6'>
        <div className='max-w-xl rounded-2xl border border-neutral-border bg-neutral-panel/90 p-6'>
          <h3 className='text-brand text-lg font-semibold mb-4'>Datos de usuario</h3>

        <div className='space-y-4'>
          <label className='block space-y-1'>
            <span className='text-sm text-zinc-300'>Nombre</span>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Tu nombre'
            />
          </label>

          <label className='block space-y-1'>
            <span className='text-sm text-zinc-300'>Email</span>
            <input
              type='email'
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='tucorreo@ejemplo.com'
            />
          </label>

          <label className='block space-y-1'>
            <span className='text-sm text-zinc-300'>Rol</span>
            <input
              className='w-full px-4 py-3 rounded-xl bg-black/40 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-brand'
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder='Tu rol'
            />
          </label>
        </div>

        <div className='flex justify-end gap-3 mt-6'>
          <a href='/projects' className='px-4 py-3 rounded-xl border border-neutral-border hover:border-accent text-zinc-300'>Volver</a>
          <button onClick={save} className='px-4 py-3 rounded-xl font-semibold bg-brand hover:bg-brand-dark'>Guardar</button>
        </div>

        {saved && (
          <div className='mt-3 text-sm text-green-400'>Perfil guardado ✓</div>
        )}
        </div>
      </div>
    </div>
  );
}


