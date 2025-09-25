import { AuthProvider, useAuth } from '@app/providers/AuthProvider.tsx';
import AppRouter from '@app/routes/AppRouter.tsx';
import Button from '@shared/components/Button.tsx';
import Input from '@shared/components/Input.tsx';
import Select from '@shared/components/Select.tsx';
import BrandHero from '@shared/components/BrandHero.jsx';
import { ROLES } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import React, { useCallback, useMemo, useState } from 'react';
import { BrowserRouter, useNavigate, Routes, Route } from 'react-router-dom';

/** Logo y marca extraídos a shared/components */

// === ErrorBoundary de clase (válido en React) ===
// ErrorBoundary eliminado para reducir ruido; AppRouter ya gestiona errores

interface LoginState {
  user: string;
  pass: string;
}

interface RegisterState {
  nombre: string;
  apellido: string;
  puesto: string;
  email: string;
  pass: string;
  pass2: string;
}

import type { Project as UIProject } from '@features/projects/pages/ProjectsScreen.tsx';

function AppInner() {
  const { mode, setMode, userName, setUserName } = useAuth();
  // ——— estado principal
  const [login, setLogin] = useState<LoginState>({ user: '', pass: '' });
  const [reg, setReg] = useState<RegisterState>({
    nombre: '',
    apellido: '',
    puesto: (ROLES[0] && (typeof ROLES[0] === 'string' ? ROLES[0] : (ROLES[0] as any).label)) || '',
    email: '',
    pass: '',
    pass2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [projects, setProjects] = useLocalStorage<UIProject[]>('projects_v1', []);
  const [activeProject, setActiveProject] = useState<UIProject | null>(null);

  const navigate = useNavigate();

  // ——— handlers memorados
  const handleLoginSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!login.user || !login.pass) return;

      const derived =
        reg.nombre?.trim() ||
        (login.user.includes('@') ? login.user.split('@')[0] : login.user) ||
        'Usuario';

      setUserName(derived);
      setMode('projects');
      navigate('/projects');
    },
    [login.user, login.pass, reg.nombre, setUserName, setMode, navigate]
  );

  const handleRegisterSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      const { nombre, apellido, email, pass, pass2 } = reg;
      if (!nombre || !apellido || !email || !pass || !pass2) {
        setError('Por favor, completa todos los campos.');
        return;
      }
      if (pass !== pass2) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      setSuccess('Registro completado con éxito ✅');
      setTimeout(() => {
        setMode('login');
        setLogin(f => ({ ...f, user: reg.email }));
        setUserName(nombre);
        setReg({
          nombre: '',
          apellido: '',
          puesto: (ROLES[0] && (typeof ROLES[0] === 'string' ? ROLES[0] : (ROLES[0] as any).label)) || '',
          email: '',
          pass: '',
          pass2: '',
        });
        setSuccess('');
        navigate('/');
      }, 1200);
    },
    [reg, setMode, setUserName, navigate]
  );

  // callbacks no usados visibles: se eliminaron para evitar ruido de linter

  // ⚠️ ESTE HOOK DEBE IR ANTES DE LOS returns condicionales
  const roleOptions: string[] = useMemo(
    () =>
      Array.isArray(ROLES)
        ? ROLES.map(r => (typeof r === 'string' ? r : (r as any).label as string))
        : [],
    []
  );

  return (
    <main id='main-content' role='main'>
      <Routes>
      <Route
        path='/'
        element={
          <div className='min-h-screen flex items-center justify-center bg-neutral-bg text-neutral-text'>
            <div className='w-full max-w-md'>
              <BrandHero tagline='All in One' />

              <div className='rounded-3xl border border-neutral-border bg-neutral-panel/90 backdrop-blur p-8 shadow-xl'>
                {mode === 'login' ? (
                  <form className='space-y-6' onSubmit={handleLoginSubmit}>
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-zinc-300'>
                        Usuario
                      </label>
                      <Input
                        type='text'
                        value={login.user}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLogin(f => ({ ...f, user: e.target.value }))
                        }
                        placeholder='Introduce tu usuario o email'
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-zinc-300'>
                        Contraseña
                      </label>
                      <Input
                        type='password'
                        value={login.pass}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLogin(f => ({ ...f, pass: e.target.value }))
                        }
                        placeholder='Introduce tu contraseña'
                      />
                    </div>

                    <Button
                      type='submit'
                      variant='primary'
                      size='lg'
                      className='w-full'
                    >
                      Iniciar sesión
                    </Button>

                    <div className='text-center'>
                      <Button
                        type='button'
                        onClick={() => setMode('register')}
                        variant='ghost'
                        className='w-full'
                      >
                        Regístrate
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Button
                      type='button'
                      onClick={() => setMode('login')}
                      variant='ghost'
                      size='sm'
                      className='mb-6 text-zinc-400 hover:text-brand'
                    >
                      ← Volver
                    </Button>

                    <form className='space-y-5' onSubmit={handleRegisterSubmit}>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-zinc-300'>
                            Nombre
                          </label>
                          <Input
                            type='text'
                            value={reg.nombre}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, nombre: e.target.value }))
                            }
                            placeholder='Nombre'
                          />
                        </div>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-zinc-300'>
                            Apellido
                          </label>
                          <Input
                            type='text'
                            value={reg.apellido}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, apellido: e.target.value }))
                            }
                            placeholder='Apellido'
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-zinc-300'>
                          Puesto
                        </label>
                        <Select
                          value={reg.puesto}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setReg(r => ({ ...r, puesto: e.target.value }))
                          }
                          options={roleOptions}
                          placeholder='Selecciona tu puesto'
                        />
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-zinc-300'>
                          Email
                        </label>
                        <Input
                          type='email'
                          value={reg.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setReg(r => ({ ...r, email: e.target.value }))
                          }
                          placeholder='tucorreo@ejemplo.com'
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-zinc-300'>
                            Contraseña
                          </label>
                          <Input
                            type='password'
                            value={reg.pass}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, pass: e.target.value }))
                            }
                            placeholder='********'
                          />
                        </div>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium text-zinc-300'>
                            Repite contraseña
                          </label>
                          <Input
                            type='password'
                            value={reg.pass2}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, pass2: e.target.value }))
                            }
                            placeholder='********'
                          />
                        </div>
                      </div>

                      {error && (
                        <div className='text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-lg px-3 py-2'>
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className='text-sm text-green-400 bg-green-950/30 border border-green-800 rounded-lg px-3 py-2'>
                          {success}
                        </div>
                      )}

                      <Button
                        type='submit'
                        variant='primary'
                        size='lg'
                        className='w-full'
                      >
                        Registrarse
                      </Button>
                    </form>
                  </>
                )}
              </div>

              <div className='h-10' />
            </div>
          </div>
        }
      />

      <Route
        path='/projects'
        element={
          <AppRouter
            mode={mode}
            setMode={setMode}
            userName={userName}
            projects={projects as UIProject[]}
            setProjects={setProjects as any}
            activeProject={activeProject as UIProject | null}
            setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
          />
        }
      />

      <Route
        path='/project/:id/*'
        element={
          <AppRouter
            mode={mode}
            setMode={setMode}
            userName={userName}
            projects={projects as UIProject[]}
            setProjects={setProjects as any}
            activeProject={activeProject as UIProject | null}
            setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
          />
        }
      />

      <Route
        path='/profile'
        element={
          <AppRouter
            mode={mode}
            setMode={setMode}
            userName={userName}
            projects={projects as UIProject[]}
            setProjects={setProjects as any}
            activeProject={activeProject as UIProject | null}
            setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
          />
        }
      />

      <Route
        path='/settings'
        element={
          <AppRouter
            mode={mode}
            setMode={setMode}
            userName={userName}
            projects={projects as UIProject[]}
            setProjects={setProjects as any}
            activeProject={activeProject as UIProject | null}
            setActiveProject={setActiveProject as unknown as (project: UIProject | null) => void}
          />
        }
      />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded'
        >
          Saltar al contenido principal
        </a>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
