import { AuthProvider, useAuth } from '@app/providers/AuthProvider.tsx';
import AppRouter from '@app/routes/AppRouter.tsx';
import Button from '@shared/components/Button.tsx';
import Input from '@shared/components/Input.tsx';
import BrandHero from '@shared/components/BrandHero.jsx';
import { ROLES } from '@shared/constants/roles';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { storage } from '@shared/services/localStorage.service';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  
  // Estados para el dropdown de puesto
  const [puestoDropdownOpen, setPuestoDropdownOpen] = useState(false);
  const [isPuestoButtonHovered, setIsPuestoButtonHovered] = useState(false);
  const [hoveredPuestoOption, setHoveredPuestoOption] = useState<string | null>(null);
  const puestoDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados para el hover de los inputs
  const [isLoginUserHovered, setIsLoginUserHovered] = useState(false);
  const [isLoginPassHovered, setIsLoginPassHovered] = useState(false);
  const [isRegNombreHovered, setIsRegNombreHovered] = useState(false);
  const [isRegApellidoHovered, setIsRegApellidoHovered] = useState(false);
  const [isRegEmailHovered, setIsRegEmailHovered] = useState(false);
  const [isRegPassHovered, setIsRegPassHovered] = useState(false);
  const [isRegPass2Hovered, setIsRegPass2Hovered] = useState(false);
  
  // Detectar el tema actual
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      if (typeof document !== 'undefined') {
        const currentTheme = (document.documentElement.getAttribute('data-theme') || 'light') as 'dark' | 'light';
        setTheme(currentTheme);
      }
    };

    const observer = new MutationObserver(updateTheme);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);
  
  const focusColor = theme === 'light' ? '#0476D9' : '#F27405';
  
  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (puestoDropdownRef.current && !puestoDropdownRef.current.contains(event.target as Node)) {
        setPuestoDropdownOpen(false);
      }
    };

    if (puestoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [puestoDropdownOpen]);

  const navigate = useNavigate();
  const [themeLabel, setThemeLabel] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const curr = document.documentElement.getAttribute('data-theme') || 'light';
      return curr === 'light' ? 'Daylight' : 'Darklight';
    }
    return 'Daylight';
  });

  // Inicializar tema desde localStorage o preferencia del sistema
  useEffect(() => {
    try {
      const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || '';
      const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      const initial = saved === 'light' || saved === 'dark' ? saved : 'light';
      const root = document.documentElement;
      root.setAttribute('data-theme', initial);
      setThemeLabel(initial === 'light' ? 'Daylight' : 'Darklight');
      const body = document.body as any;
      body.style.backgroundColor = 'var(--bg)';
      body.style.color = 'var(--text)';
    } catch {}
  }, []);

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

  // Normalizar proyectos existentes para asegurar que tengan country y region
  useEffect(() => {
    if (projects.length === 0) return;
    const needsUpdate = projects.some(p => !p.country || !p.region);
    if (needsUpdate) {
      const normalized = projects.map(p => ({
        ...p,
        country: p.country || 'ES',
        region: p.region || 'CT',
      }));
      setProjects(normalized);
    }
  }, []); // Solo ejecutar una vez al montar

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
          <div className='min-h-screen flex items-center justify-center' style={{backgroundColor: 'var(--bg)', color: 'var(--text)'}}>
            <div className='w-full max-w-md landing'>
              <BrandHero tagline='All in One' />

              <div className='flex justify-end mb-4'>
                <button
                  type='button'
                  onClick={() => {
                    let next = 'dark';
                    try {
                      const root = document.documentElement;
                      const curr = root.getAttribute('data-theme') || 'dark';
                      next = curr === 'light' ? 'dark' : 'light';
                      root.setAttribute('data-theme', next);
                      setThemeLabel(next === 'light' ? 'Daylight' : 'Darklight');
                      const body = document.body as any;
                      body.style.backgroundColor = 'var(--bg)';
                      body.style.color = 'var(--text)';
                    } catch {}
                    // Persistir preferencia en ambas ubicaciones para mantener sync
                    try { 
                      localStorage.setItem('theme', next);
                      const s = storage.getJSON<any>('settings_v1') || {};
                      storage.setJSON('settings_v1', { ...s, theme: next });
                    } catch {}
                  }}
                  className='px-4 py-2 rounded-xl border hover:border-[var(--hover-border)] text-sm'
                  style={{
                    backgroundColor:
                      (typeof document!=='undefined' && (document.documentElement.getAttribute('data-theme')||'dark')==='light')
                        ? '#A0D3F2'
                        : '#f59e0b',
                    color:
                      (typeof document!=='undefined' && (document.documentElement.getAttribute('data-theme')||'dark')==='light')
                        ? '#111827'
                        : '#ffffff',
                    borderColor:
                      (typeof document!=='undefined' && (document.documentElement.getAttribute('data-theme')||'dark')==='light')
                        ? '#A0D3F2'
                        : '#f59e0b'
                  }}
                  title={themeLabel}
                  aria-pressed={document.documentElement.getAttribute('data-theme') === 'light'}
                >
                  {themeLabel}
                </button>
              </div>

              <div className='rounded-2xl border border-neutral-border backdrop-blur p-8 shadow-2xl' style={{backgroundColor: 'var(--panel)'}}>
                {mode === 'login' ? (
                  <form className='space-y-6' onSubmit={handleLoginSubmit}>
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                        Usuario
                      </label>
                      <Input
                        type='text'
                        value={login.user}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLogin(f => ({ ...f, user: e.target.value }))
                        }
                        onMouseEnter={() => setIsLoginUserHovered(true)}
                        onMouseLeave={() => setIsLoginUserHovered(false)}
                        onBlur={() => setIsLoginUserHovered(false)}
                        placeholder='Introduce tu usuario o email'
                        style={{
                          borderWidth: isLoginUserHovered ? '1.5px' : '1px',
                          borderStyle: 'solid',
                          borderColor: isLoginUserHovered && theme === 'light' 
                            ? '#0476D9' 
                            : (isLoginUserHovered && theme === 'dark'
                              ? '#fff'
                              : 'var(--border)'),
                        }}
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                        Contraseña
                      </label>
                      <Input
                        type='password'
                        value={login.pass}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLogin(f => ({ ...f, pass: e.target.value }))
                        }
                        onMouseEnter={() => setIsLoginPassHovered(true)}
                        onMouseLeave={() => setIsLoginPassHovered(false)}
                        onBlur={() => setIsLoginPassHovered(false)}
                        placeholder='Introduce tu contraseña'
                        style={{
                          borderWidth: isLoginPassHovered ? '1.5px' : '1px',
                          borderStyle: 'solid',
                          borderColor: isLoginPassHovered && theme === 'light' 
                            ? '#0476D9' 
                            : (isLoginPassHovered && theme === 'dark'
                              ? '#fff'
                              : 'var(--border)'),
                        }}
                      />
                    </div>

                    <Button
                      type='submit'
                      variant='primary'
                      size='lg'
                      className='w-full'
                      style={{backgroundColor: 'var(--brand)', borderColor: 'var(--brand)'}}
                    >
                      Iniciar sesión
                    </Button>

                    <div className='text-center'>
                      <button
                        type='button'
                        onClick={() => setMode('register')}
                        className='text-sm transition-colors'
                        style={{color: '#f97316'}}
                      >
                        ¿No tienes cuenta?{' '}
                        <span className='font-medium hover:underline'>
                          Regístrate
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Button
                      type='button'
                      onClick={() => setMode('login')}
                      variant='ghost'
                      size='sm'
                      className='mb-6 btn-back-register'
                      style={{color: 'var(--accent)'}}
                    >
                      ← Volver
                    </Button>

                    <form className='space-y-5' onSubmit={handleRegisterSubmit}>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                            Nombre
                          </label>
                          <Input
                            type='text'
                            value={reg.nombre}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, nombre: e.target.value }))
                            }
                            onMouseEnter={() => setIsRegNombreHovered(true)}
                            onMouseLeave={() => setIsRegNombreHovered(false)}
                            onBlur={() => setIsRegNombreHovered(false)}
                            placeholder='Nombre'
                            style={{
                              borderWidth: isRegNombreHovered ? '1.5px' : '1px',
                              borderStyle: 'solid',
                              borderColor: isRegNombreHovered && theme === 'light' 
                                ? '#0476D9' 
                                : (isRegNombreHovered && theme === 'dark'
                                  ? '#fff'
                                  : 'var(--border)'),
                            }}
                          />
                        </div>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                            Apellido
                          </label>
                          <Input
                            type='text'
                            value={reg.apellido}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, apellido: e.target.value }))
                            }
                            onMouseEnter={() => setIsRegApellidoHovered(true)}
                            onMouseLeave={() => setIsRegApellidoHovered(false)}
                            onBlur={() => setIsRegApellidoHovered(false)}
                            placeholder='Apellido'
                            style={{
                              borderWidth: isRegApellidoHovered ? '1.5px' : '1px',
                              borderStyle: 'solid',
                              borderColor: isRegApellidoHovered && theme === 'light' 
                                ? '#0476D9' 
                                : (isRegApellidoHovered && theme === 'dark'
                                  ? '#fff'
                                  : 'var(--border)'),
                            }}
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                          Puesto
                        </label>
                        <div className='relative' ref={puestoDropdownRef}>
                          <button
                            type='button'
                            onClick={() => setPuestoDropdownOpen(!puestoDropdownOpen)}
                            onMouseEnter={() => setIsPuestoButtonHovered(true)}
                            onMouseLeave={() => setIsPuestoButtonHovered(false)}
                            onBlur={() => setIsPuestoButtonHovered(false)}
                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm text-center transition-colors ${
                              theme === 'light' 
                                ? 'bg-white text-gray-900' 
                                : 'bg-black/40 text-zinc-300'
                            }`}
                            style={{
                              borderWidth: isPuestoButtonHovered ? '1.5px' : '1px',
                              borderStyle: 'solid',
                              borderColor: isPuestoButtonHovered && theme === 'light' 
                                ? '#0476D9' 
                                : (isPuestoButtonHovered && theme === 'dark'
                                  ? '#fff'
                                  : 'var(--border)'),
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.5rem center',
                              paddingRight: '2rem',
                            }}
                          >
                            {reg.puesto || '\u00A0'}
                          </button>
                          {puestoDropdownOpen && (
                            <div className={`absolute top-full left-0 mt-1 w-full border border-neutral-border rounded-lg shadow-lg z-50 overflow-y-auto max-h-60 ${
                              theme === 'light' ? 'bg-white' : 'bg-neutral-panel'
                            }`}>
                              {roleOptions.map(opt => (
                                <button
                                  key={opt}
                                  type='button'
                                  onClick={() => {
                                    setReg(r => ({ ...r, puesto: opt }));
                                    setPuestoDropdownOpen(false);
                                    setHoveredPuestoOption(null);
                                  }}
                                  onMouseEnter={() => setHoveredPuestoOption(opt)}
                                  onMouseLeave={() => setHoveredPuestoOption(null)}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                    theme === 'light' 
                                      ? 'text-gray-900' 
                                      : 'text-zinc-300'
                                  }`}
                                  style={{
                                    backgroundColor: hoveredPuestoOption === opt 
                                      ? (theme === 'light' ? '#A0D3F2' : focusColor)
                                      : 'transparent',
                                    color: hoveredPuestoOption === opt 
                                      ? (theme === 'light' ? '#111827' : 'white')
                                      : 'inherit',
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                          Email
                        </label>
                        <Input
                          type='email'
                          value={reg.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setReg(r => ({ ...r, email: e.target.value }))
                          }
                          onMouseEnter={() => setIsRegEmailHovered(true)}
                          onMouseLeave={() => setIsRegEmailHovered(false)}
                          onBlur={() => setIsRegEmailHovered(false)}
                          placeholder='tucorreo@ejemplo.com'
                          style={{
                            borderWidth: isRegEmailHovered ? '1.5px' : '1px',
                            borderStyle: 'solid',
                            borderColor: isRegEmailHovered && theme === 'light' 
                              ? '#0476D9' 
                              : (isRegEmailHovered && theme === 'dark'
                                ? '#fff'
                                : 'var(--border)'),
                          }}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                          Contraseña
                        </label>
                          <Input
                            type='password'
                            value={reg.pass}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, pass: e.target.value }))
                            }
                            onMouseEnter={() => setIsRegPassHovered(true)}
                            onMouseLeave={() => setIsRegPassHovered(false)}
                            onBlur={() => setIsRegPassHovered(false)}
                            placeholder='********'
                            style={{
                              borderWidth: isRegPassHovered ? '1.5px' : '1px',
                              borderStyle: 'solid',
                              borderColor: isRegPassHovered && theme === 'light' 
                                ? '#0476D9' 
                                : (isRegPassHovered && theme === 'dark'
                                  ? '#fff'
                                  : 'var(--border)'),
                            }}
                          />
                        </div>
                        <div className='space-y-2'>
                          <label className='block text-sm font-medium' style={{color: 'var(--text)'}}>
                            Repite contraseña
                          </label>
                          <Input
                            type='password'
                            value={reg.pass2}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setReg(r => ({ ...r, pass2: e.target.value }))
                            }
                            onMouseEnter={() => setIsRegPass2Hovered(true)}
                            onMouseLeave={() => setIsRegPass2Hovered(false)}
                            onBlur={() => setIsRegPass2Hovered(false)}
                            placeholder='********'
                            style={{
                              borderWidth: isRegPass2Hovered ? '1.5px' : '1px',
                              borderStyle: 'solid',
                              borderColor: isRegPass2Hovered && theme === 'light' 
                                ? '#0476D9' 
                                : (isRegPass2Hovered && theme === 'dark'
                                  ? '#fff'
                                  : 'var(--border)'),
                            }}
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
                      style={{backgroundColor: 'var(--brand)', borderColor: 'var(--brand)'}}
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
